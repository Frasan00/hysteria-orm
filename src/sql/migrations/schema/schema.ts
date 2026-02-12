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
import { AddColumnNode } from "../../ast/query/node/alter_table/add_column";
import { AddConstraintNode } from "../../ast/query/node/alter_table/add_constraint";
import { ColumnTypeNode } from "../../ast/query/node/column";
import { ConstraintNode } from "../../ast/query/node/constraint";
import { CreateTableNode } from "../../ast/query/node/create_table";
import { DropTableNode } from "../../ast/query/node/drop_table";
import { CreateExtensionNode } from "../../ast/query/node/extension/create_extension";
import { CreateIndexNode, DropIndexNode } from "../../ast/query/node/index_op";
import { RawNode } from "../../ast/query/node/raw/raw_node";
import { TruncateNode } from "../../ast/query/node/truncate";
import { QueryNode } from "../../ast/query/query";
import {
  getDefaultFkConstraintName,
  getDefaultIndexName,
  getDefaultUniqueConstraintName,
} from "../../models/decorators/model_decorators_constants";
import { Model } from "../../models/model";
import type { SqlDataSourceType } from "../../sql_data_source_types";
import { getColumnValue } from "../../resources/utils";
import { AlterTableBuilder } from "./alter_table";
import { CreateTableBuilder } from "./create_table";
import {
  CommonConstraintOptions,
  CommonPostgresExtensions,
  DatabaseTableOptions,
} from "./schema_types";

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
   * @description Adds a raw statement to define a default value as is
   * @example
   * ```ts
   * schema.rawStatement("CURRENT_TIMESTAMP");
   * schema.alterTable("users", (table) => {
   *   table.timestamp("created_at").default(this.schema.rawStatement("CURRENT_TIMESTAMP"));
   * });
   * ```
   */
  rawStatement(value: string) {
    return new RawNode(value);
  }

  /**
   * @description Add raw query to the migration
   */
  rawQuery(query: string): void {
    this.queryStatements.push(query);
  }

  /**
   * @description Executes the queries built by the schema
   */
  async execute(): Promise<void> {
    for (const query of this.queryStatements) {
      this.rawQuery(query);
    }
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
   * @mssql Does not support ifNotExists option
   */
  createTable(
    table: string,
    cb: (table: CreateTableBuilder) => void,
    options?: { ifNotExists?: boolean } & DatabaseTableOptions,
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

    const allOptions = {
      ...options,
      ...(this.sqlType === "mysql" || this.sqlType === "mariadb"
        ? tableBuilder.getMysqlOptions() || {}
        : {}),
    };

    const createTableNode = new CreateTableNode(
      table,
      nodes,
      tableBuilder.getNamedConstraints() as ConstraintNode[],
      options?.ifNotExists,
      allOptions,
    );

    const frag = astParser.parse([createTableNode]).sql;
    const stmt = frag.startsWith("create table")
      ? frag
      : `create table ${frag}`;
    this.rawQuery(stmt);

    this.generateAutoUpdateTriggers(table, nodes);
  }

  /**
   * @description Alter table constructor
   * @mssql Limited support - cannot modify columns with constraints; see AlterTableBuilder methods for details
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

    const addColumnNodes = nodes
      .filter((n) => n.file === "add_column")
      .map((n) => (n as AddColumnNode).column);
    this.generateAutoUpdateTriggers(table, addColumnNodes);
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
   * @mssql Uses sp_rename procedure; does not update references in views/procedures/triggers
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
    const node = new TruncateNode(table, true);
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
    options: CommonConstraintOptions = {},
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

  /**
   * @description Adds a CHECK constraint to a table
   * @param table The table name
   * @param expression The SQL expression for the check constraint (e.g., "age >= 18", "price > 0")
   * @param options Optional constraint name and other options
   * @example
   * ```ts
   * schema.addCheck("users", "age >= 18", { constraintName: "users_age_check" });
   * schema.addCheck("products", "price > 0 AND stock >= 0");
   * ```
   */
  addCheck(
    table: string,
    expression: string,
    options?: CommonConstraintOptions,
  ): void {
    const constraintName =
      options?.constraintName ?? `chk_${table}_custom`.substring(0, 63);

    const constraint = new ConstraintNode("check", {
      checkExpression: expression,
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
   * @description Drops a CHECK constraint from a table
   * @param table The table name
   * @param constraintName The name of the check constraint to drop
   * @example
   * ```ts
   * schema.dropCheck("users", "users_age_check");
   * ```
   */
  dropCheck(table: string, constraintName: string): void {
    this.dropConstraint(table, constraintName);
  }

  /**
   * @description Create database extension, only supported for postgres
   * @postgres Supports extensions like PostGIS, uuid-ossp, hstore, etc.
   * @mysql Extensions are not supported - outputs a comment
   * @sqlite Extensions are loaded dynamically - outputs a comment
   * @mssql Extensions are not supported - outputs a comment
   * @oracledb Extensions are not supported - outputs a comment
   */
  createExtension(
    extensionName: CommonPostgresExtensions,
    ifNotExists?: boolean,
  ): void;
  createExtension(extensionName: string, ifNotExists?: boolean): void;
  createExtension(
    extensionName: string | CommonPostgresExtensions,
    ifNotExists: boolean = true,
  ): void {
    const node = new CreateExtensionNode(extensionName, ifNotExists);
    const astParser = this.generateAstInstance({
      table: "",
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  private generateAutoUpdateTriggers(table: string, nodes: QueryNode[]): void {
    if (this.sqlType === "mysql" || this.sqlType === "mariadb") {
      return;
    }

    const autoUpdateColumns = nodes
      .filter(
        (n) =>
          n.folder === "column" && (n as ColumnTypeNode).autoUpdate === true,
      )
      .map((n) => getColumnValue((n as ColumnTypeNode).column));

    for (const column of autoUpdateColumns) {
      const triggerStatements = this.getAutoUpdateTriggerSql(table, column);
      for (const stmt of triggerStatements) {
        this.rawQuery(stmt);
      }
    }
  }

  private getAutoUpdateTriggerSql(table: string, column: string): string[] {
    const triggerName = `trg_${table}_${column}_auto_update`;

    switch (this.sqlType) {
      case "postgres":
      case "cockroachdb":
        return [
          `CREATE OR REPLACE FUNCTION ${triggerName}_fn() RETURNS trigger AS $$ BEGIN NEW."${column}" = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql`,
          `CREATE OR REPLACE TRIGGER ${triggerName} BEFORE UPDATE ON "${table}" FOR EACH ROW EXECUTE FUNCTION ${triggerName}_fn()`,
        ];

      case "sqlite":
        return [
          `CREATE TRIGGER IF NOT EXISTS ${triggerName} AFTER UPDATE ON "${table}" FOR EACH ROW BEGIN UPDATE "${table}" SET "${column}" = CURRENT_TIMESTAMP WHERE rowid = NEW.rowid; END`,
        ];

      case "mssql":
        return [
          `CREATE OR ALTER TRIGGER [${triggerName}] ON [${table}] AFTER UPDATE AS BEGIN SET NOCOUNT ON; UPDATE t SET t.[${column}] = CURRENT_TIMESTAMP FROM [${table}] t INNER JOIN inserted i ON t.[id] = i.[id]; END`,
        ];

      case "oracledb":
        return [
          `CREATE OR REPLACE TRIGGER "${triggerName}" BEFORE UPDATE ON "${table}" FOR EACH ROW BEGIN :NEW."${column}" := CURRENT_TIMESTAMP; END;`,
        ];

      default:
        return [];
    }
  }

  private generateAstInstance(model: typeof Model): AstParser {
    return new AstParser(model, this.sqlType);
  }
}
