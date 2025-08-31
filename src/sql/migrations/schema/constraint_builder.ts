import { ColumnTypeNode } from "../../ast/query/node/column";
import { ConstraintNode } from "../../ast/query/node/constraint";
import { AfterConstraintNode } from "../../ast/query/node/constraint/after";
import { QueryNode } from "../../ast/query/query";
import {
  getDefaultFkConstraintName,
  getDefaultPrimaryKeyConstraintName,
  getDefaultUniqueConstraintName,
} from "../../models/decorators/model_decorators_constants";
import { getColumnValue } from "../../resources/utils";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { BaseBuilder } from "./base_builder";
import {
  CommonConstraintOptions,
  CreateTableContext,
  ForeignKeyOptions,
  PrimaryKeyOptions,
} from "./schema_types";

export class ConstraintBuilder extends BaseBuilder {
  private readonly columnNode: ColumnTypeNode;
  private readonly tableName?: string;
  private namedConstraints: QueryNode[];
  private context: CreateTableContext;
  private sqlType: SqlDataSourceType;

  constructor(
    sqlType: SqlDataSourceType,
    nodes: QueryNode[],
    columnNode: ColumnTypeNode,
    tableName?: string,
    namedConstraints: QueryNode[] = [],
    context: CreateTableContext = "create_table",
  ) {
    super(nodes);
    this.columnNode = columnNode;
    this.tableName = tableName;
    this.namedConstraints = namedConstraints;
    this.context = context;
    this.sqlType = sqlType;
  }

  // #region primary key
  /**
   * @description Adds a primary key constraint to the column, if no constraint name is provided, it will be generated using the standard pattern: pk_${table}_${column}
   * @param options is the options for the primary key constraint
   */
  primaryKey(options?: PrimaryKeyOptions): this {
    const defaultName = getDefaultPrimaryKeyConstraintName(
      this.tableName as string,
      getColumnValue(this.columnNode.column),
    );

    if (this.context === "alter_table") {
      this.nodes.push(
        new ConstraintNode("primary_key", {
          columns: [getColumnValue(this.columnNode.column)],
          constraintName: options?.constraintName ?? defaultName,
        }),
      );

      return this;
    }

    if (this.sqlType === "sqlite") {
      return this.handleSqliteAutoIncrement(
        options || { constraintName: defaultName },
      );
    }

    this.namedConstraints.push(
      new ConstraintNode("primary_key", {
        columns: [getColumnValue(this.columnNode.column)],
        constraintName: options?.constraintName ?? defaultName,
      }),
    );

    return this;
  }

  // #endregion

  // #region foreign key

  /**
   * @description Adds a foreign key constraint to the column, if no constraint name is provided, it will be generated using the standard pattern: fk_${table}_${leftColumn}_${rightColumn}
   * @param references is the table and column name to reference, e.g. "users.id"
   * @param options is the options for the foreign key constraint
   */
  foreignKey(
    references: `${string}.${string}`,
    options?: ForeignKeyOptions,
  ): this {
    const [table, cols] = references.split(".");
    const refCols = cols.split(",");
    const name =
      options?.constraintName ??
      getDefaultFkConstraintName(
        this.tableName ?? "",
        getColumnValue(this.columnNode.column),
        refCols[0],
      );

    if (this.context === "alter_table") {
      this.nodes.push(
        new ConstraintNode("foreign_key", {
          columns: [getColumnValue(this.columnNode.column)],
          references: { table, columns: refCols },
          constraintName: name,
          onDelete: options?.onDelete,
          onUpdate: options?.onUpdate,
        }),
      );

      return this;
    }

    this.namedConstraints.push(
      new ConstraintNode("foreign_key", {
        columns: [getColumnValue(this.columnNode.column)],
        references: { table, columns: refCols },
        constraintName: name,
        onDelete: options?.onDelete,
        onUpdate: options?.onUpdate,
      }),
    );

    return this;
  }

  /**
   * @description Sets the column to auto increment
   */
  increment(): this {
    this.columnNode.autoIncrement = true;
    return this;
  }

  // #endregion

  // #region not nullable
  /**
   * @description Sets the column to not nullable
   */
  notNullable(): this {
    this.nodes.push(
      new ConstraintNode("not_null", {
        columns: [getColumnValue(this.columnNode.column)],
      }),
    );
    return this;
  }

  // #endregion

  // #region nullable
  /**
   * @description Sets the column to nullable, by default it already is nullable, this method is only used for alter table
   */
  nullable(): this {
    this.nodes.push(
      new ConstraintNode("null", {
        columns: [getColumnValue(this.columnNode.column)],
      }),
    );

    return this;
  }

  // #endregion

  // #region default
  /**
   * @description Sets the default value for the column
   * @param value is the default value for the column
   */
  default(value: string | number | boolean | null): this {
    let defaultVal: string | undefined;

    if (value === null) {
      defaultVal = "NULL";
    } else if (typeof value === "boolean") {
      defaultVal = value ? "TRUE" : "FALSE";
    } else if (value !== undefined) {
      defaultVal = value.toString();
    }

    this.nodes.push(
      new ConstraintNode("default", {
        defaultValue: defaultVal,
      }),
    );

    return this;
  }

  // #endregion

  // #region unique
  /**
   * @description Sets the column to unique
   * @param options is the options for the unique constraint
   */
  unique(options?: CommonConstraintOptions): this {
    if (this.context === "alter_table") {
      this.nodes.push(
        new ConstraintNode("unique", {
          columns: [getColumnValue(this.columnNode.column)],
          constraintName:
            options?.constraintName ??
            getDefaultUniqueConstraintName(
              this.tableName ?? "",
              getColumnValue(this.columnNode.column),
            ),
        }),
      );

      return this;
    }

    this.namedConstraints.push(
      new ConstraintNode("unique", {
        columns: [getColumnValue(this.columnNode.column)],
        constraintName:
          options?.constraintName ||
          getDefaultUniqueConstraintName(
            this.tableName ?? "",
            getColumnValue(this.columnNode.column),
          ),
      }),
    );

    return this;
  }
  // #endregion

  // #region after
  /**
   * @description Sets the column to be after another column
   * @param columnName is the name of the column to be after
   * @mysql only
   */
  after(columnName: string): this {
    this.nodes.push(new AfterConstraintNode(columnName));
    return this;
  }

  // #endregion

  // Sqlite is special, it doesn't support auto increment on primary key table wise, so we need to handle it inline in column definition
  private handleSqliteAutoIncrement(options?: PrimaryKeyOptions): this {
    this.nodes.push(
      new ConstraintNode("primary_key", {
        columns: [getColumnValue(this.columnNode.column)],
        constraintName: options?.constraintName,
        autoIncrement: this.columnNode.autoIncrement,
        columnType: "integer",
      } as any),
    );
    return this;
  }
}
