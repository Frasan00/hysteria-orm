import Schema from "./schema";
import type { SqlDataSourceType } from "../../sql_data_source_types";
import type { SqlDataSource } from "../../sql_data_source";
import {
  CommonConstraintOptions,
  CommonPostgresExtensions,
  DatabaseTableOptions,
} from "./schema_types";
import type { CreateTableBuilder } from "./create_table";
import type { AlterTableBuilder } from "./alter_table";
import { RawNode } from "../../ast/query/node/raw/raw_node";

type SchemaBuilderState = "pending" | "executed" | "failed";

/**
 * @description SchemaBuilder class for building and executing DDL queries
 * @description Implements PromiseLike to support both await-based execution and query retrieval
 *
 * @example Execute when awaited:
 * ```ts
 * await sql.schema().createTable("users", (table) => {
 *   table.addColumn("id", "integer", { primaryKey: true });
 * });
 * ```
 *
 * @example Get SQL without executing:
 * ```ts
 * const sql = sql.schema().createTable("users", (table) => {
 *   table.addColumn("id", "integer", { primaryKey: true });
 * }).toQuery();
 * ```
 *
 * @example Multiple operations:
 * ```ts
 * const builder = sql.schema();
 * builder.createTable("users", (table) => { ... });
 * builder.createTable("posts", (table) => { ... });
 * await builder; // Execute all
 * ```
 */
export class SchemaBuilder implements PromiseLike<void> {
  private schema: Schema;
  private dataSource: SqlDataSource;
  private executionPromise: Promise<void> | null = null;
  private state: SchemaBuilderState = "pending";
  private executionError: Error | null = null;

  constructor(dataSource: SqlDataSource, sqlType?: SqlDataSourceType) {
    this.dataSource = dataSource;
    this.schema = new Schema(sqlType || dataSource.getDbType());
  }

  // ============================================
  // PromiseLike implementation
  // ============================================

  /**
   * @description PromiseLike.then implementation - called when awaiting the builder
   * @description Executes all pending SQL queries on first await
   */
  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    if (this.state === "pending") {
      this.executionPromise = this.#executeInternal();
    }
    return this.executionPromise!.then(onfulfilled, onrejected);
  }

  // ============================================
  // Schema methods (delegation to internal Schema)
  // ============================================

  /**
   * @description Adds a raw statement to define a default value as is
   */
  rawStatement(value: string): RawNode {
    return this.schema.rawStatement(value);
  }

  /**
   * @description Add raw query to the schema
   */
  rawQuery(query: string): this {
    this.schema.rawQuery(query);
    return this;
  }

  /**
   * @description Create table constructor
   */
  createTable(
    table: string,
    cb: (table: CreateTableBuilder) => void,
    options?: { ifNotExists?: boolean } & DatabaseTableOptions,
  ): this {
    this.schema.createTable(table, cb, options);
    return this;
  }

  /**
   * @description Alter table constructor
   */
  alterTable(table: string, cb: (t: AlterTableBuilder) => void): this {
    this.schema.alterTable(table, cb);
    return this;
  }

  /**
   * @description Drop table in the database
   */
  dropTable(table: string, ifExists: boolean = false): this {
    this.schema.dropTable(table, ifExists);
    return this;
  }

  /**
   * @description Rename table in the database
   */
  renameTable(oldTable: string, newTable: string): this {
    this.schema.renameTable(oldTable, newTable);
    return this;
  }

  /**
   * @description Truncate table
   */
  truncateTable(table: string): this {
    this.schema.truncateTable(table);
    return this;
  }

  /**
   * @description Create index on table
   */
  createIndex(
    table: string,
    columns: string[] | string,
    options?: CommonConstraintOptions,
  ): this {
    this.schema.createIndex(table, columns, options);
    return this;
  }

  /**
   * @description Drop index on table
   */
  dropIndex(indexName: string, table?: string): this {
    this.schema.dropIndex(indexName, table);
    return this;
  }

  /**
   * @description Adds a primary key to a table
   */
  addPrimaryKey(table: string, columns: string[]): this {
    this.schema.addPrimaryKey(table, columns);
    return this;
  }

  /**
   * @description Adds a UNIQUE constraint to a table
   */
  addUnique(
    table: string,
    columns: string[] | string,
    options?: CommonConstraintOptions,
  ): this {
    this.schema.addUnique(table, columns, options);
    return this;
  }

  /**
   * @description Adds a constraint to a table
   */
  addConstraint(table: string, type: string, ...rest: any[]): this {
    (this.schema as any).addConstraint(table, type, ...rest);
    return this;
  }

  /**
   * @description Drops a primary key from a table
   */
  dropPrimaryKey(table: string): this {
    this.schema.dropPrimaryKey(table);
    return this;
  }

  /**
   * @description Drops a foreign key from a table
   */
  dropForeignKey(table: string, leftColumn: string, rightColumn: string): this {
    this.schema.dropForeignKey(table, leftColumn, rightColumn);
    return this;
  }

  /**
   * @description Drops a UNIQUE constraint from a table
   */
  dropUnique(
    table: string,
    columnsOrConstraintName: string | string[],
    options?: CommonConstraintOptions,
  ): this {
    this.schema.dropUnique(table, columnsOrConstraintName, options);
    return this;
  }

  /**
   * @description Drops a constraint from a table
   */
  dropConstraint(table: string, constraintName: string): this {
    this.schema.dropConstraint(table, constraintName);
    return this;
  }

  /**
   * @description Create database extension, only supported for postgres
   */
  createExtension(
    extensionName: CommonPostgresExtensions,
    ifNotExists?: boolean,
  ): this;
  createExtension(extensionName: string, ifNotExists?: boolean): this;
  createExtension(
    extensionName: string | CommonPostgresExtensions,
    ifNotExists: boolean = true,
  ): this {
    this.schema.createExtension(extensionName, ifNotExists);
    return this;
  }

  // ============================================
  // Query retrieval methods
  // ============================================

  /**
   * @description Returns the SQL statement(s)
   * @returns Single string if one statement, array if multiple
   */
  toQuery(): string | string[] {
    const statements = this.schema.queryStatements;
    return statements.length === 1 ? statements[0] : statements;
  }

  /**
   * @description Returns all statements as an array
   */
  toQueries(): string[] {
    return [...this.schema.queryStatements];
  }

  /**
   * @description Returns the SQL statement(s) as a formatted string
   */
  toString(): string {
    const statements = this.schema.queryStatements;
    return statements.length === 1
      ? statements[0] || ""
      : statements.join(";\n");
  }

  // ============================================
  // Explicit execution methods
  // ============================================

  /**
   * @description Executes all pending SQL queries
   * @description Can be called explicitly or via await (PromiseLike)
   */
  async execute(): Promise<void> {
    if (this.state === "executed") {
      return;
    }
    if (this.state === "failed") {
      throw this.executionError;
    }
    return this.then();
  }

  /**
   * @description Returns true if the builder has been executed
   */
  isExecuted(): boolean {
    return this.state === "executed";
  }

  /**
   * @description Returns true if the builder is pending execution
   */
  isPending(): boolean {
    return this.state === "pending";
  }

  /**
   * @description Returns true if the builder execution failed
   */
  hasFailed(): boolean {
    return this.state === "failed";
  }

  // ============================================
  // Private execution logic
  // ============================================

  async #executeInternal(): Promise<void> {
    try {
      this.state = "pending";
      const queries = this.schema.queryStatements;

      if (!queries.length) {
        this.state = "executed";
        return;
      }

      // Execute all queries
      for (const query of queries) {
        await this.dataSource.rawQuery(query);
      }

      this.state = "executed";
    } catch (error) {
      this.state = "failed";
      this.executionError = error as Error;
      throw error;
    }
  }
}

export default SchemaBuilder;
