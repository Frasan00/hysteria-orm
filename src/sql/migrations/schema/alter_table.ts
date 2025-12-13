import { HysteriaError } from "../../../errors/hysteria_error";
import { ConstraintNode } from "../../ast/query/node";
import {
  AddColumnNode,
  AddPrimaryKeyNode,
  AlterColumnTypeNode,
  DropColumnNode,
  DropDefaultNode,
  RenameColumnNode,
  SetDefaultNode,
} from "../../ast/query/node/alter_table";
import { AddConstraintNode } from "../../ast/query/node/alter_table/add_constraint";
import { DropConstraintNode } from "../../ast/query/node/alter_table/drop_constraint";
import { DropNotNullNode } from "../../ast/query/node/alter_table/drop_not_null";
import { DropPrimaryKeyNode } from "../../ast/query/node/alter_table/drop_primary_key";
import { SetNotNullNode } from "../../ast/query/node/alter_table/set_not_null";
import { ColumnTypeNode } from "../../ast/query/node/column";
import { RawNode } from "../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../ast/query/query";
import {
  getDefaultFkConstraintName,
  getDefaultUniqueConstraintName,
} from "../../models/decorators/model_decorators_constants";
import { getColumnValue } from "../../resources/utils";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { BaseBuilder } from "./base_builder";
import { ConstraintBuilder } from "./constraint_builder";
import { CreateTableBuilder } from "./create_table";
import { CommonConstraintOptions, ForeignKeyOptions } from "./schema_types";

export class AlterTableBuilder extends BaseBuilder {
  private table: string;
  private sqlType: SqlDataSourceType;

  constructor(table: string, nodes: QueryNode[], sqlType: SqlDataSourceType) {
    super(nodes);
    this.table = table;
    this.sqlType = sqlType;
  }

  /**
   * @description Adds a raw statement to define a default value as is
   * @example
   * ```ts
   * table.varchar("name").default(table.rawStatement("CURRENT_TIMESTAMP"));
   * ```
   */
  rawStatement(value: string): RawNode {
    return new RawNode(value);
  }

  /**
   * @description Adds a column to the table
   * @param cb is the callback that will be used to build the column
   * @mssql Auto-generates default constraint names (DF__table__col__xxxxx) which are hard to drop later
   */
  addColumn(cb: (col: CreateTableBuilder) => ConstraintBuilder): void {
    let tempNodes: QueryNode[] = [];
    const builder = new CreateTableBuilder(
      this.sqlType,
      tempNodes,
      this.table,
      "alter_table",
    );
    const constraints = cb(builder);
    if (!tempNodes.length) {
      return;
    }

    const namedConstraints: QueryNode[] = builder.getNamedConstraints();
    const columnNodes = tempNodes.filter((n) => n.folder === "column");
    tempNodes = tempNodes.concat(namedConstraints);

    if (columnNodes.length !== 1) {
      throw new Error("addColumn callback must define exactly one column");
    }

    const colNode = columnNodes[0] as ColumnTypeNode;

    const inlineConstraints = constraints.getNodes().filter((n: QueryNode) => {
      const constraintNode = n as ConstraintNode;
      return (
        constraintNode.constraintType === "not_null" ||
        constraintNode.constraintType === "null" ||
        constraintNode.constraintType === "default"
      );
    });

    const addColumnNode = new AddColumnNode(colNode);
    (addColumnNode as any).inlineConstraints = inlineConstraints;
    this.nodes.push(addColumnNode);

    const namedConstraintNodes = constraints
      .getNodes()
      .filter((n: QueryNode) => {
        const constraintNode = n as ConstraintNode;
        return (
          constraintNode.constraintType === "unique" ||
          constraintNode.constraintType === "foreign_key" ||
          constraintNode.constraintType === "primary_key"
        );
      });

    namedConstraintNodes.forEach((n) => {
      this.nodes.push(new AddConstraintNode(n as ConstraintNode));
    });
  }

  /**
   * @description Alters a column, can generate multiple sql statements depending on the constraints
   * @throws HysteriaError if sqlite database
   * @mssql Cannot alter columns with DEFAULT/CHECK constraints or indexes - drop them first
   */
  alterColumn(columnBuilder: (col: CreateTableBuilder) => ConstraintBuilder) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::alterColumn",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    const tempNodes: QueryNode[] = [];
    const builder = new CreateTableBuilder(
      this.sqlType,
      tempNodes,
      this.table,
      "alter_table",
    );

    const constraints = columnBuilder(builder);
    if (!tempNodes.length) {
      return;
    }

    const columnNodes = tempNodes.filter((n) => n.folder === "column");
    if (columnNodes.length !== 1) {
      throw new Error("alterColumn callback must define exactly one column");
    }

    const colNode = columnNodes[0] as ColumnTypeNode;
    const columnName = getColumnValue(colNode.column);
    const isNullable = constraints.getNodes().find((n: QueryNode) => {
      const constraintNode = n as ConstraintNode;
      return constraintNode.constraintType === "null";
    }) as ConstraintNode;

    const isNotNullable = constraints.getNodes().find((n: QueryNode) => {
      const constraintNode = n as ConstraintNode;
      return constraintNode.constraintType === "not_null";
    }) as ConstraintNode | undefined;

    const nullableNode: ConstraintNode | undefined =
      isNotNullable || isNullable;
    const hasDefault = constraints.getNodes().find((n: QueryNode) => {
      const constraintNode = n as ConstraintNode;
      return constraintNode.constraintType === "default";
    }) as ConstraintNode | undefined;

    // Always push type change node
    this.nodes.push(
      new AlterColumnTypeNode(getColumnValue(columnName), colNode, {}),
    );

    // Nullability
    if (nullableNode) {
      if (nullableNode.constraintType === "not_null") {
        this.nodes.push(new SetNotNullNode(getColumnValue(columnName)));
      } else if (nullableNode.constraintType === "null") {
        this.nodes.push(new DropNotNullNode(getColumnValue(columnName)));
      }
    }

    // Default
    if (hasDefault) {
      if (
        hasDefault.defaultValue === undefined ||
        hasDefault.defaultValue === null
      ) {
        this.nodes.push(new DropDefaultNode(getColumnValue(columnName)));
      } else {
        this.nodes.push(
          new SetDefaultNode(
            getColumnValue(columnName),
            hasDefault.defaultValue,
          ),
        );
      }
    }

    // wrap related constraint nodes
    constraints.getNodes().forEach((n: QueryNode) => {
      const constraintNode = n as ConstraintNode;
      switch (constraintNode.constraintType) {
        case "primary_key":
          this.addPrimaryKey(getColumnValue(columnName));
          break;
        case "unique":
          this.unique(getColumnValue(columnName), {
            constraintName: constraintNode.constraintName,
          });
          break;
        case "foreign_key":
          this.foreignKey(
            getColumnValue(columnName),
            constraintNode.references?.table ?? "",
            getColumnValue(constraintNode.references?.columns?.[0] ?? ""),
            {
              constraintName: constraintNode.constraintName,
              onDelete: constraintNode.onDelete,
              onUpdate: constraintNode.onUpdate,
            },
          );
          break;
      }
    });
  }

  /**
   * @description Drops a column
   * @mssql Must drop all dependent constraints and indexes before dropping the column
   */
  dropColumn(name: string) {
    this.nodes.push(new DropColumnNode(name));
  }

  /**
   * @description Renames a column
   * @mssql Uses sp_rename procedure; does not update references in views/procedures/triggers
   */
  renameColumn(oldName: string, newName: string) {
    this.nodes.push(new RenameColumnNode(oldName, newName));
  }

  /**
   * @description Drops a default value from a column
   * @sqlite not supported and will throw error
   * @mssql Requires constraint name; use dropConstraint() with name from sys.default_constraints
   */
  dropDefault(columnName: string) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::alterColumn",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    this.nodes.push(new DropDefaultNode(columnName));
  }

  /**
   * @description Adds a primary key constraint to a column
   * @param columnName is the column name to add the primary key to
   * @sqlite not supported and will throw error
   * @mssql Column must be NOT NULL before adding primary key
   */
  addPrimaryKey(columnName: string) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::alterColumn",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    this.nodes.push(new AddPrimaryKeyNode([columnName]));
  }

  /**
   * @description Raw non type safe way builder to add a constraint
   * @sqlite not supported and will throw error
   * @mssql UNIQUE does not allow multiple NULLs (unlike PostgreSQL)
   */
  addConstraint(...options: ConstructorParameters<typeof ConstraintNode>) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::alterColumn",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    this.nodes.push(new AddConstraintNode(new ConstraintNode(...options)));
  }

  /**
   * @description Adds a foreign key constraint to a column
   * @param columnName is the column name in the current table
   * @param foreignTable is the referenced table name
   * @param foreignColumn is the referenced column name
   * @param options optional foreign key options (constraintName, onDelete, onUpdate)
   * @sqlite not supported and will throw error
   */
  foreignKey(
    columnName: string,
    foreignTable: string,
    foreignColumn: string,
    options?: ForeignKeyOptions,
  ) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::alterColumn",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    this.nodes.push(
      new AddConstraintNode(
        new ConstraintNode("foreign_key", {
          columns: [columnName],
          references: { table: foreignTable, columns: [foreignColumn] },
          constraintName:
            options?.constraintName ??
            getDefaultFkConstraintName(this.table, columnName, foreignColumn),
          onDelete: options?.onDelete,
          onUpdate: options?.onUpdate,
        }),
      ),
    );
  }

  /**
   * @description Adds a unique constraint to a column
   * @description By default generates a constraint name using standard pattern: uq_${table}_${column}
   * @param columnName is the column name in the current table
   * @param options optional constraint options (constraintName)
   * @sqlite not supported and will throw error
   */
  unique(columnName: string, options?: CommonConstraintOptions) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::alterColumn",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    this.nodes.push(
      new AddConstraintNode(
        new ConstraintNode("unique", {
          columns: [columnName],
          constraintName:
            options?.constraintName ??
            getDefaultUniqueConstraintName(this.table, columnName),
        }),
      ),
    );
  }

  /**
   * @description Drops a foreign key by column name and referenced column, generates constraint name using standard pattern: fk_${table}_${leftColumn}_${rightColumn}
   * @description If a custom constraint name was used to generate the foreign key, use `dropConstraint` instead
   * @param leftColumn is the current model column name (e.g. userId)
   * @param rightColumn is the referenced model column name (e.g. id)
   * @sqlite not supported and will throw error
   */
  dropForeignKey(leftColumn: string, rightColumn: string) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::dropPrimaryKey",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    const defaultConstraintName = getDefaultFkConstraintName(
      this.table,
      leftColumn,
      rightColumn,
    );
    this.nodes.push(new DropConstraintNode(defaultConstraintName));
  }

  /**
   * @description Drops a unique constraint by column name, generates constraint name using standard pattern: uq_${table}_${column}
   * @description If a custom constraint name was used to generate the unique constraint, use `dropConstraint` instead
   * @param columnName is the current model column name (e.g. userId)
   * @sqlite not supported and will throw error
   * @cockroachdb not supported
   */
  dropUnique(columnName: string, options?: CommonConstraintOptions) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::dropUnique",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    if (this.sqlType === "cockroachdb") {
      throw new HysteriaError(
        "AlterTableBuilder::dropUnique",
        "COCKROACHDB_NOT_SUPPORTED",
        new Error("cockroachdb does not support alter table statements"),
      );
    }

    const defaultConstraintName =
      options?.constraintName ??
      getDefaultUniqueConstraintName(this.table, columnName);

    this.nodes.push(new DropConstraintNode(defaultConstraintName));
  }

  /**
   * @description Drops a constraint by constraint name
   * @sqlite not supported and will throw error
   */
  dropConstraint(constraintName: string) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::dropConstraint",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    this.nodes.push(new DropConstraintNode(constraintName));
  }

  /**
   * @description Drops the primary key constraint
   * @postgres not supported, use `dropConstraint` instead with the pk constraint name
   * @sqlite not supported and will throw error
   * @throws HysteriaError if postgres and table is not provided
   * @mssql Foreign keys referencing this primary key must be dropped first
   */
  dropPrimaryKey(table?: string) {
    if (this.sqlType === "sqlite") {
      throw new HysteriaError(
        "AlterTableBuilder::dropPrimaryKey",
        "SQLITE_NOT_SUPPORTED",
        new Error("sqlite does not support alter table statements"),
      );
    }

    if (this.sqlType === "postgres" && !table) {
      throw new HysteriaError(
        "AlterTableBuilder::dropPrimaryKey",
        "POSTGRES_TABLE_REQUIRED",
        new Error("postgres requires the table name"),
      );
    }

    this.nodes.push(new DropPrimaryKeyNode(table));
  }
}
