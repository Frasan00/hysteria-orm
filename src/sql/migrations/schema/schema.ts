import fs from "node:fs";
import path from "node:path";
import { env } from "../../../env/env";
import { HysteriaError } from "../../../errors/hysteria_error";
import { AstParser } from "../../ast/parser";
import {
  AddPrimaryKeyNode,
  AlterTableNode,
  DropConstraintNode,
  DropPrimaryKeyNode,
  RenameTableNode,
} from "../../ast/query/node/alter_table";
import { AddConstraintNode } from "../../ast/query/node/alter_table/add_constraint";
import { ConstraintNode } from "../../ast/query/node/constraint";
import { CreateTableNode } from "../../ast/query/node/create_table";
import { DropTableNode } from "../../ast/query/node/drop_table";
import { CreateIndexNode, DropIndexNode } from "../../ast/query/node/index_op";
import { TruncateNode } from "../../ast/query/node/truncate";
import { QueryNode } from "../../ast/query/query";
import {
  getDefaultFkConstraintName,
  getDefaultIndexName,
  getDefaultUniqueConstraintName,
} from "../../models/decorators/model_decorators_constants";
import { Model } from "../../models/model";
import type { SqlDataSourceType } from "../../sql_data_source_types";
import { AlterTableBuilder } from "./alter_table";
import { CreateTableBuilder } from "./create_table";
import { CommonConstraintOptions } from "./schema_types";

export default class Schema {
  queryStatements: string[];
  sqlType: SqlDataSourceType;

  constructor(sqlType?: SqlDataSourceType) {
    this.sqlType = (sqlType || env.DB_TYPE) as SqlDataSourceType;

    if (!this.sqlType) {
      throw new HysteriaError(
        "Schema::constructor",
        "ENV_NOT_SET",
        new Error("env not set, please set DB_TYPE in .env file"),
      );
    }

    this.queryStatements = [];
  }

  /**
   * @description Add raw query to the migration
   */
  rawQuery(query: string): void {
    this.queryStatements.push(query);
  }

  /**
   * @description Runs the sql in the given file, throws error if file does not exist or is not .sql or .txt
   * @description File is splitted by semicolons and each statement is executed separately and in order
   */
  runFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new HysteriaError(
        "Schema::runFile",
        `FILE_NOT_FOUND_OR_NOT_ACCESSIBLE`,
      );
    }

    const file = path.basename(filePath);
    const fileExtension = path.extname(file);
    if (fileExtension !== ".sql" && fileExtension !== ".txt") {
      throw new HysteriaError("Schema::runFile", `FILE_NOT_A_SQL_OR_TXT_FILE`);
    }

    const query = fs.readFileSync(filePath, "utf-8");

    const statements = query
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      this.rawQuery(statement);
    }
  }

  /**
   * @description Create table constructor
   */
  createTable(
    table: string,
    cb: (table: CreateTableBuilder) => void,
    options?: { ifNotExists?: boolean },
  ): void {
    const tableBuilder = new CreateTableBuilder(this.sqlType, [], table);
    cb(tableBuilder);

    const nodes = tableBuilder.getNodes();
    const astParser = new AstParser(
      {
        table: table,
        databaseCaseConvention: "preserve",
        modelCaseConvention: "preserve",
      } as typeof Model,
      this.sqlType,
    );

    const createTableNode = new CreateTableNode(
      table,
      nodes,
      tableBuilder.getNamedConstraints() as ConstraintNode[],
      options?.ifNotExists,
    );

    const frag = astParser.parse([createTableNode]).sql;
    const stmt = frag.startsWith("create table")
      ? frag
      : `create table ${frag}`;
    this.rawQuery(stmt);
  }

  /**
   * @description Alter table constructor
   */
  alterTable(table: string, cb: (t: AlterTableBuilder) => void): void {
    const nodes: QueryNode[] = [];
    const builder = new AlterTableBuilder(table, nodes, this.sqlType);
    cb(builder);

    if (!nodes.length) {
      return;
    }

    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);

    let group: QueryNode[] = [];
    const flushGroup = () => {
      if (!group.length) {
        return;
      }

      const nodeGroup = new AlterTableNode(table, group);
      const frag = astParser.parse([nodeGroup]).sql;
      if (!frag || !frag.trim()) {
        return;
      }

      const stmt = frag.startsWith("alter table")
        ? frag
        : `alter table ${frag}`;
      this.rawQuery(stmt);
      group = [];
    };

    for (const child of nodes) {
      if (
        child.file === "add_constraint" &&
        group.length &&
        (group[0] as any).file === "add_column"
      ) {
        // merge with current add column group
        group.push(child);
      } else {
        flushGroup();
        group.push(child);
      }
    }
    flushGroup();
  }

  /**
   * @description Drop table in the database
   */
  dropTable(table: string, ifExists: boolean = false): void {
    const node = new DropTableNode(table, ifExists);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Rename table in the database
   */
  renameTable(oldTable: string, newTable: string): void {
    const node = new AlterTableNode(oldTable, [new RenameTableNode(newTable)]);
    const astParser = this.generateAstInstance({
      table: oldTable,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);

    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Truncate table
   */
  truncateTable(table: string): void {
    const node = new TruncateNode(table);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Create index on table
   */
  createIndex(
    table: string,
    columns: string[] | string,
    options: CommonConstraintOptions,
  ): void {
    if (!Array.isArray(columns)) {
      columns = [columns];
    }

    const indexName =
      options.constraintName || getDefaultIndexName(table, columns.join("_"));
    const node = new CreateIndexNode(table, columns, indexName);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Drop index on table
   * @mysql requires table name for index drop
   */
  dropIndex(indexName: string, table?: string): void {
    const node = new DropIndexNode(indexName, table);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Adds a primary key to a table
   */
  addPrimaryKey(table: string, columns: string[]): void {
    const node = new AddPrimaryKeyNode(columns);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Adds a UNIQUE constraint to a table
   */
  addUnique(
    table: string,
    columns: string[] | string,
    options?: CommonConstraintOptions,
  ): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    const constraintName =
      options?.constraintName ??
      getDefaultUniqueConstraintName(table, cols.join("_"));

    const constraint = new ConstraintNode("unique", {
      columns: cols,
      constraintName,
    });

    const alterNode = new AlterTableNode(table, [
      new AddConstraintNode(constraint),
    ]);

    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);

    this.rawQuery(astParser.parse([alterNode]).sql);
  }

  /**
   * @description Drops a foreign key from a table, uses a standard constraint name pattern: fk_${table}_${leftColumn}_${rightColumn}
   * @description If a custom constraint name was used to generate the foreign key, use `dropConstraint` instead
   */
  dropForeignKey(table: string, leftColumn: string, rightColumn: string): void {
    const constraintName = getDefaultFkConstraintName(
      table,
      leftColumn,
      rightColumn,
    );

    const dropNode = new DropConstraintNode(constraintName);
    const alterNode = new AlterTableNode(table, [dropNode]);

    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);

    this.rawQuery(astParser.parse([alterNode]).sql);
  }

  /**
   * @description Drops a UNIQUE constraint from a table
   * @description If no constraintName is provided, it computes the default name using columns
   */
  dropUnique(
    table: string,
    columnsOrConstraintName: string | string[],
    options?: CommonConstraintOptions,
  ): void {
    const computedName = Array.isArray(columnsOrConstraintName)
      ? getDefaultUniqueConstraintName(table, columnsOrConstraintName.join("_"))
      : getDefaultUniqueConstraintName(table, columnsOrConstraintName);

    const constraintName = options?.constraintName ?? computedName;

    const dropNode = new DropConstraintNode(constraintName);
    const alterNode = new AlterTableNode(table, [dropNode]);

    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);

    this.rawQuery(astParser.parse([alterNode]).sql);
  }

  /**
   * @description Drops a primary key from a table
   */
  dropPrimaryKey(table: string): void {
    const node = new DropPrimaryKeyNode();
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Adds a foreign key to a table
   */
  addConstraint(
    table: string,
    ...options: ConstructorParameters<typeof ConstraintNode>
  ): void {
    const constraint = new ConstraintNode(...options);

    const alterNode = new AlterTableNode(table, [
      new AddConstraintNode(constraint),
    ]);

    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([alterNode]).sql);
  }

  /**
   * @description Drops a constraint from a table
   */
  dropConstraint(table: string, constraintName: string): void {
    const node = new DropConstraintNode(constraintName);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  private generateAstInstance(model: typeof Model): AstParser {
    return new AstParser(model, this.sqlType);
  }
}
