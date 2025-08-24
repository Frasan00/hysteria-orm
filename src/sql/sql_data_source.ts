import { FormatOptionsWithLanguage } from "sql-formatter";
import { DataSource } from "../data_source/data_source";
import { HysteriaError } from "../errors/hysteria_error";
import { generateOpenApiModelWithMetadata } from "../openapi/openapi";
import logger from "../utils/logger";
import { AstParser } from "./ast/parser";
import { RawNode } from "./ast/query/node/raw/raw_node";
import { ForeignKeyInfoNode } from "./ast/query/node/schema";
import { IndexInfoNode } from "./ast/query/node/schema/index_info";
import { TableInfoNode } from "./ast/query/node/schema/table_info";
import { Model } from "./models/model";
import { ModelManager } from "./models/model_manager/model_manager";
import { QueryBuilder } from "./query_builder/query_builder";
import type {
  TableColumnInfo,
  TableForeignKeyInfo,
  TableIndexInfo,
  TableSchemaInfo,
} from "./schema_introspection_types";
import { createSqlConnection } from "./sql_connection_utils";
import type {
  AugmentedSqlDataSource,
  ConnectionPolicies,
  GetCurrentConnectionReturnType,
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlConnectionType,
  SqlDataSourceInput,
  SqlDataSourceModel,
  SqlDataSourceType,
  SqliteConnectionInstance,
  UseConnectionInput,
} from "./sql_data_source_types";
import { execSql, getSqlDialect } from "./sql_runner/sql_runner";
import { Transaction } from "./transactions/transaction";
import {
  StartTransactionOptions,
  TransactionExecutionOptions,
} from "./transactions/transaction_types";
import Schema from "./migrations/schema/schema";

/**
 * @description The SqlDataSource class is the main class for interacting with the database, it's used to create connections, execute queries, and manage transactions
 */
export class SqlDataSource extends DataSource {
  declare private sqlConnection: SqlConnectionType | null;
  private static instance: SqlDataSource | null = null;
  private globalTransaction: Transaction | null = null;
  private sqlType: SqlDataSourceType;
  private models: Record<string, SqlDataSourceModel> = {};

  /**
   * @description The retry policy for the database connection
   */
  retryPolicy: ConnectionPolicies["retry"];
  queryFormatOptions: FormatOptionsWithLanguage;

  // Static Methods

  /**
   * @description Establishes the default singleton connection used by default by all the Models, if not configuration is passed, env variables will be used instead
   * @description You can continue to use the global sql class exported by hysteria after the connection without having to rely on the return of this function
   * @throws {HysteriaError} If using models in input, and the model key is already used by the sql data source instance e.g. a model called `connect` is already used by the sql data source instance and will throw an error
   * @example
   * ```ts
   * import { sql } from "hysteria-orm";
   * const connection = await sql.connect();
   * // You can use both connection and sql from now own, since `sql` will use the default connection after being connected
   * connection.query();
   * sql.query();
   *
   * // Models will use the default connection after being connected
   * User.query(); // Will use the default connection
   * ```
   */
  static async connect<T extends Record<string, SqlDataSourceModel> = {}>(
    input: SqlDataSourceInput<T>,
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<AugmentedSqlDataSource<T>>;
  static async connect<T extends Record<string, SqlDataSourceModel> = {}>(
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connect<T extends Record<string, SqlDataSourceModel> = {}>(
    inputOrCb?:
      | SqlDataSourceInput<T>
      | ((sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void),
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<AugmentedSqlDataSource<T>> {
    if (typeof inputOrCb === "function") {
      cb = inputOrCb;
      inputOrCb = undefined;
    }

    const sqlDataSource = new this(inputOrCb as SqlDataSourceInput<T>);
    if (inputOrCb?.models) {
      const sanitizeModelKeys = sqlDataSource.sanitizeModelKeys(
        inputOrCb?.models || {},
      );

      Object.assign(sqlDataSource, sanitizeModelKeys);
    }

    sqlDataSource.models = inputOrCb?.models || {};
    sqlDataSource.sqlConnection = await createSqlConnection(
      sqlDataSource.sqlType,
      {
        type: sqlDataSource.sqlType,
        host: sqlDataSource.host,
        port: sqlDataSource.port,
        username: sqlDataSource.username,
        password: sqlDataSource.password,
        database: sqlDataSource.database,
        timezone: inputOrCb?.timezone,
      },
    );

    await sqlDataSource.testConnectionQuery("SELECT 1");
    SqlDataSource.instance = sqlDataSource;

    await cb?.(sqlDataSource as AugmentedSqlDataSource<T>);
    return sqlDataSource as AugmentedSqlDataSource<T>;
  }

  /**
   * @description Get's another database connection and return it, this won't be marked as the default connection used by the Models, for that use the static method `connect`
   * @description By default not used by the Models, you have to pass it as a parameter to the Models to use it
   * @throws {HysteriaError} If using models in input, and the model key is already used by the sql data source instance e.g. a model called `connect` is already used by the sql data source instance and will throw an error
   * @example
   * ```ts
   * const anotherSql = await Sql.connectToSecondarySource({
   *    ...connectionData
   * });
   *
   * const user = await User.query({ useConnection: anotherSql }).many();
   * ```
   */
  static async connectToSecondarySource<
    T extends Record<string, SqlDataSourceModel> = {},
  >(
    input: SqlDataSourceInput<T>,
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<AugmentedSqlDataSource<T>>;
  static async connectToSecondarySource<
    T extends Record<string, SqlDataSourceModel> = {},
  >(
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connectToSecondarySource<
    T extends Record<string, SqlDataSourceModel> = {},
  >(
    inputOrCb?:
      | SqlDataSourceInput<T>
      | ((sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void),
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<AugmentedSqlDataSource<T>> {
    if (typeof inputOrCb === "function") {
      cb = inputOrCb;
      inputOrCb = undefined;
    }

    const sqlDataSource = new this(inputOrCb as SqlDataSourceInput);
    if (inputOrCb?.models) {
      const sanitizeModelKeys = sqlDataSource.sanitizeModelKeys(
        inputOrCb.models,
      );

      Object.assign(sqlDataSource, sanitizeModelKeys);
    }

    sqlDataSource.models = inputOrCb?.models || {};
    sqlDataSource.sqlConnection = await createSqlConnection(
      sqlDataSource.sqlType,
      {
        type: sqlDataSource.sqlType,
        host: sqlDataSource.host,
        port: sqlDataSource.port,
        username: sqlDataSource.username,
        password: sqlDataSource.password,
        database: sqlDataSource.database,
        timezone: inputOrCb?.timezone,
      },
    );

    await sqlDataSource.testConnectionQuery("SELECT 1");
    SqlDataSource.instance = sqlDataSource;

    await cb?.(sqlDataSource as AugmentedSqlDataSource<T>);
    return sqlDataSource as AugmentedSqlDataSource<T>;
  }

  /**
   * @description Creates a new connection and executes a callback with the new instance, the connection is automatically closed after the callback is executed, so it's lifespan is only inside the callback
   * @description By default not used by the Models, you have to pass it as a parameter to the Models to use it
   * @throws {HysteriaError} If using models in input, and the model key is already used by the sql data source instance e.g. a model called `connect` is already used by the sql data source instance and will throw an error
   * @example
   * ```ts
   * await Sql.useConnection({
   *    ...connectionData
   * }, (sql) => {
   *    const user = await User.query({ useConnection: sql }).many();
   * });
   * ```
   */
  static async useConnection<T extends Record<string, SqlDataSourceModel> = {}>(
    connectionDetails: UseConnectionInput<T>,
    cb: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void>,
  ): Promise<void> {
    const customSqlInstance = new SqlDataSource(connectionDetails);
    if (connectionDetails.models) {
      const sanitizeModelKeys = customSqlInstance.sanitizeModelKeys(
        connectionDetails.models,
      );

      Object.assign(customSqlInstance, sanitizeModelKeys);
    }

    customSqlInstance.models = connectionDetails.models || {};
    customSqlInstance.sqlConnection = await createSqlConnection(
      customSqlInstance.sqlType,
      {
        ...connectionDetails,
      },
    );

    await customSqlInstance.testConnectionQuery("SELECT 1");

    try {
      await cb(customSqlInstance as AugmentedSqlDataSource<T>).then(
        async () => {
          if (!customSqlInstance.isConnected) {
            return;
          }

          await customSqlInstance.closeConnection();
        },
      );
    } catch (error) {
      if (customSqlInstance.isConnected) {
        await customSqlInstance.closeConnection();
      }

      throw error;
    }
  }

  /**
   * @description Returns the instance of the SqlDataSource
   * @throws {HysteriaError} If the connection is not established
   */
  static getInstance(): SqlDataSource {
    if (!SqlDataSource.instance) {
      throw new HysteriaError(
        "SqlDataSource::getInstance",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return SqlDataSource.instance;
  }

  /**
   * @description Returns a QueryBuilder instance
   * @description Query builder from the SqlDataSource instance returns raw data from the database, the data is not parsed or serialized in any way
   * @description Optimal for performance-critical operations
   * @description Use Models to have type safety and serialization
   */
  static query(table: string): QueryBuilder {
    return new QueryBuilder(
      {
        modelCaseConvention: "preserve",
        databaseCaseConvention: "preserve",
        table: table,
      } as typeof Model,
      this.getInstance(),
    );
  }

  /**
   * @description Creates a table on the database, return the query to be executed to create the table
   */
  static createTable(...args: Parameters<Schema["createTable"]>): string {
    return this.getInstance().createTable(...args);
  }

  /**
   * @description Alters a table on the database, return the queries to be executed in order to alter the table
   */
  static alterTable(...args: Parameters<Schema["alterTable"]>): string[] {
    return this.getInstance().alterTable(...args);
  }

  /**
   * @description Starts a transaction on the database and executes a callback with the transaction instance, automatically committing or rolling back the transaction based on the callback's success or failure
   */
  static async useTransaction(
    cb: (trx: Transaction) => Promise<void>,
    options?: StartTransactionOptions,
  ): Promise<void> {
    return this.getInstance().useTransaction(cb, options);
  }

  /**
   * @description Starts a global transaction on the database
   */
  static async startGlobalTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction> {
    return this.getInstance().startGlobalTransaction(options);
  }

  /**
   * @description Commits a global transaction on the database
   * @throws {HysteriaError} If the global transaction is not started
   */
  static async commitGlobalTransaction(): Promise<void> {
    await this.getInstance().commitGlobalTransaction();
  }

  /**
   * @description Rolls back a global transaction on the database
   * @throws {HysteriaError} If the global transaction is not started
   */
  static async rollbackGlobalTransaction(): Promise<void> {
    await this.getInstance().rollbackGlobalTransaction();
  }

  /**
   * @description Starts a transaction on the database and returns a Transaction instance
   */
  static async startTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(options);
  }

  /**
   * @alias startTransaction
   */
  static async beginTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(options);
  }

  /**
   * @alias startTransaction
   */
  static async transaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(options);
  }

  /**
   * @description Retrieves informations from the database for the given table
   */
  static async getTableSchema(table: string): Promise<TableSchemaInfo> {
    return this.getInstance().getTableSchema(table);
  }

  /**
   * @description Closes the current connection
   */
  static async closeConnection(): Promise<void> {
    if (!this.instance) {
      logger.warn("Connection already closed");
      return;
    }

    return this.getInstance().closeConnection();
  }

  /**
   * @alias closeConnection
   */
  static async disconnect(): Promise<void> {
    return this.closeConnection();
  }

  /**
   * @description Executes a raw query on the database
   */
  static async rawQuery<T = any>(
    query: string,
    params: any[] = [],
  ): Promise<T> {
    return this.getInstance().rawQuery(query, params);
  }

  /**
   * @description Adds a raw statement to an operation like where or update, those raw values won't be used as bindings and will be used as the are
   * @example
   * ```ts
   * import { sql } from "hysteria-orm";
   *
   * await User.query().where("name", sql.rawStatement("LOWER(name)"));
   * ```
   */
  static rawStatement(value: string) {
    return this.getInstance().rawStatement(value);
  }

  // Instance Methods
  private constructor(input?: SqlDataSourceInput) {
    super(input);
    this.sqlType = this.type as SqlDataSourceType;
    this.retryPolicy = input?.connectionPolicies?.retry || {
      maxRetries: 0,
      delay: 0,
    };
    this.queryFormatOptions = input?.queryFormatOptions || {
      language: getSqlDialect(this.sqlType),
      keywordCase: "lower",
      dataTypeCase: "lower",
      functionCase: "lower",
    };
  }

  /**
   * @description Returns true if the connection is established
   */
  get isConnected(): boolean {
    return !!this.sqlConnection;
  }

  /**
   * @description Returns the type of the database
   */
  getDbType(): SqlDataSourceType {
    return this.type as SqlDataSourceType;
  }

  /**
   * @description Returns a QueryBuilder instance
   * @description Query builder from the SqlDataSource instance uses raw data from the database so the data is not parsed or serialized in any way
   * @description Optimal for performance-critical operations
   * @description Use Models to have type safety and serialization
   */
  query(table: string): QueryBuilder {
    return new QueryBuilder(
      {
        modelCaseConvention: "preserve",
        databaseCaseConvention: "preserve",
        table: table,
      } as typeof Model,
      this,
    );
  }

  /**
   * @description Alters a table on the database, return the queries to be executed in order to alter the table
   */
  alterTable(...args: Parameters<Schema["alterTable"]>): string[] {
    const schema = new Schema(this.getDbType());
    schema.alterTable(...args);
    return schema.queryStatements;
  }

  /**
   * @description Creates a table on the database, return the query to be executed to create the table
   */
  createTable(...args: Parameters<Schema["createTable"]>): string {
    const schema = new Schema(this.getDbType());
    schema.createTable(...args);
    return schema.queryStatements[0] || "";
  }

  /**
   * @description Starts a transaction on the database and executes a callback with the transaction instance, automatically committing or rolling back the transaction based on the callback's success or failure
   */
  async useTransaction(
    cb: (trx: Transaction) => Promise<void>,
    options?: StartTransactionOptions,
  ): Promise<void> {
    const trx = await this.startTransaction(options);
    try {
      await cb(trx).then(async () => {
        if (!trx.isActive) {
          return;
        }

        await trx.commit();
      });
    } catch (error) {
      if (!trx.isActive) {
        return;
      }

      await trx.rollback();
      throw error;
    }
  }

  /**
   * @description Starts a global transaction on the database on the main connection
   */
  async startGlobalTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction> {
    this.globalTransaction = new Transaction(this, options?.isolationLevel);
    await this.globalTransaction.startTransaction();
    return this.globalTransaction;
  }

  /**
   * @description Commits a global transaction on the database on the main connection
   * @throws {HysteriaError} If the global transaction is not started
   */
  async commitGlobalTransaction(
    options?: Omit<TransactionExecutionOptions, "endConnection">,
  ): Promise<void> {
    if (!this.globalTransaction) {
      throw new HysteriaError(
        "SqlDataSource::commitGlobalTransaction",
        "GLOBAL_TRANSACTION_NOT_STARTED",
      );
    }

    await this.globalTransaction?.commit({
      throwErrorOnInactiveTransaction: options?.throwErrorOnInactiveTransaction,
      endConnection: false,
    });
    this.globalTransaction = null;
  }

  /**
   * @description Rolls back a global transaction on the database on the main connection, it doesn't end the connection since it's the main connection
   * @throws {HysteriaError} If the global transaction is not started and options.throwErrorOnInactiveTransaction is true
   */
  async rollbackGlobalTransaction(
    options?: Omit<TransactionExecutionOptions, "endConnection">,
  ): Promise<void> {
    if (!this.globalTransaction) {
      throw new HysteriaError(
        "SqlDataSource::rollbackGlobalTransaction",
        "GLOBAL_TRANSACTION_NOT_STARTED",
      );
    }

    await this.globalTransaction?.rollback({
      throwErrorOnInactiveTransaction: options?.throwErrorOnInactiveTransaction,
      endConnection: false,
    });
    this.globalTransaction = null;
  }

  /**
   * @description Starts a transaction on the database and returns a Transaction instance
   */
  async startTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction> {
    const sqlDataSource = new SqlDataSource({
      type: this.sqlType,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      ...options?.driverSpecificOptions,
    });

    sqlDataSource.sqlConnection = await createSqlConnection(
      sqlDataSource.sqlType,
      {
        type: sqlDataSource.sqlType,
        host: sqlDataSource.host,
        port: sqlDataSource.port,
        username: sqlDataSource.username,
        password: sqlDataSource.password,
        database: sqlDataSource.database,
        ...options?.driverSpecificOptions,
      },
    );

    const sqlTrx = new Transaction(sqlDataSource, options?.isolationLevel);
    await sqlTrx.startTransaction();
    return sqlTrx;
  }

  /**
   * @alias startTransaction
   */
  async beginTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction> {
    return this.startTransaction(options);
  }

  /**
   * @alias startTransaction
   */
  async transaction(options?: StartTransactionOptions): Promise<Transaction> {
    return this.startTransaction(options);
  }

  /**
   * @description Returns a ModelManager instance for the given model, it's advised to use Model static methods instead
   */
  getModelManager<T extends Model>(
    model: { new (): T } | typeof Model,
  ): ModelManager<T> {
    if (!this.isConnected) {
      throw new HysteriaError(
        "SqlDataSource::getModelManager",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return new ModelManager(model as typeof Model, this);
  }

  /**
   * @description Returns the current raw driver connection, you can specify the type of connection you want to get to have better type safety
   * @example
   * const mysqlConnection = sqlDataSource.getCurrentDriverConnection("mysql"); // mysql2 connection
   * const pgConnection = sqlDataSource.getCurrentDriverConnection("postgres"); // pg connection
   * const sqliteConnection = sqlDataSource.getCurrentDriverConnection("sqlite"); // sqlite3 connection
   */
  getCurrentDriverConnection<T extends SqlDataSourceType = typeof this.sqlType>(
    _specificType: T = this.sqlType as T,
  ): GetCurrentConnectionReturnType<T> {
    return this.sqlConnection as GetCurrentConnectionReturnType<T>;
  }

  /**
   * @description Closes the current connection
   */
  async closeConnection(): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Connection already closed ");
      return;
    }

    logger.warn("Closing connection");
    switch (this.type) {
      case "mysql":
      case "mariadb":
        await (this.sqlConnection as MysqlConnectionInstance).end();
        this.sqlConnection = null;
        break;
      case "postgres":
      case "cockroachdb":
        (this.sqlConnection as PgPoolClientInstance).end();
        this.sqlConnection = null;
        break;
      case "sqlite":
        await new Promise<void>((resolve, reject) => {
          (this.sqlConnection as SqliteConnectionInstance).close((err) => {
            if (err) {
              reject(err);
            }
            resolve();
          });
        });
        this.sqlConnection = null;
        break;
      default:
        throw new HysteriaError(
          "SqlDataSource::closeConnection",
          `UNSUPPORTED_DATABASE_TYPE_${this.type}`,
        );
    }
  }

  async getConnectionDetails(): Promise<SqlDataSourceInput> {
    return {
      type: this.getDbType(),
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      connectionPolicies: this.retryPolicy as ConnectionPolicies,
      queryFormatOptions: this.queryFormatOptions,
    };
  }

  /**
   * @alias closeConnection
   */
  async disconnect(): Promise<void> {
    return this.closeConnection();
  }

  /**
   * @description Executes a raw query on the database
   */
  async rawQuery<T = any>(query: string, params: any[] = []): Promise<T> {
    if (!this.isConnected) {
      throw new HysteriaError(
        "SqlDataSource::rawQuery",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return execSql(query, params, this);
  }

  /**
   * @description Adds a raw statement to an operation like where or update, those raw values won't be used as bindings and will be used as the are
   * @example
   * ```ts
   * import { sql } from "hysteria-orm";
   *
   * await User.query().where("name", sql.rawStatement("LOWER(name)"));
   * ```
   */
  rawStatement(value: string) {
    return new RawNode(value);
  }

  /**
   * @description Retrieves informations from the database for the given table
   */
  async getTableSchema(table: string): Promise<TableSchemaInfo> {
    const [columns, indexes, foreignKeys] = await Promise.all([
      this.getTableInfo(table),
      this.getIndexInfo(table),
      this.getForeignKeyInfo(table),
    ]);

    return { columns, indexes, foreignKeys };
  }

  /**
   * @description Models provided inside the connection method will always be used for openapi schema generation
   */
  getModelOpenApiSchema() {
    return generateOpenApiModelWithMetadata(
      Object.values(this.models) as unknown as (new () => Model)[],
    );
  }

  /**
   * @description Introspects table columns metadata
   */
  async getTableInfo(table: string): Promise<TableColumnInfo[]> {
    const ast = new AstParser(
      {
        table,
        databaseCaseConvention: "preserve",
        modelCaseConvention: "preserve",
      } as typeof Model,
      this.getDbType(),
    );

    const sql = ast.parse([new TableInfoNode(table)]).sql;
    const rows: any[] = await this.rawQuery(sql);
    const db = this.getDbType();
    if (db === "sqlite") {
      return rows.map((r: any) => ({
        name: r.name,
        dataType: (r.type || "").toLowerCase(),
        isNullable: r.notnull === 0,
        defaultValue: r.dflt_value ?? null,
      }));
    }

    return rows.map((r: any) => ({
      name: String(r.column_name || r.COLUMN_NAME || r.name || ""),
      dataType: String(
        r.data_type || r.DATA_TYPE || r.type || "",
      ).toLowerCase(),
      isNullable:
        String(
          r.is_nullable || r.IS_NULLABLE || r.notnull === 0 ? "YES" : "NO",
        ).toLowerCase() !== "no",
      defaultValue:
        r.column_default ??
        r.COLUMN_DEFAULT ??
        r.defaultValue ??
        r.dflt_value ??
        null,
      length: r.char_length != null ? Number(r.char_length) : null,
      precision:
        r.numeric_precision != null ? Number(r.numeric_precision) : null,
      scale: r.numeric_scale != null ? Number(r.numeric_scale) : null,
    }));
  }

  /**
   * @description Introspects table indexes metadata using AST-driven queries
   */
  async getIndexInfo(table: string): Promise<TableIndexInfo[]> {
    const ast = new AstParser(
      {
        table,
        databaseCaseConvention: "preserve",
        modelCaseConvention: "preserve",
      } as typeof Model,
      this.getDbType(),
    );

    const sql = ast.parse([new IndexInfoNode(table)]).sql;
    const db = this.getDbType();
    const rows: any[] = await this.rawQuery(sql);
    if (db === "mysql" || db === "mariadb") {
      const map = new Map<
        string,
        { name: string; columns: string[]; isUnique: boolean }
      >();
      for (const r of rows) {
        const key = r.Key_name;
        const isUnique = r.Non_unique === 0;
        const arr = map.get(key) || {
          name: key,
          columns: [] as string[],
          isUnique,
        };
        arr.columns.push(r.Column_name);
        map.set(key, arr);
      }
      return Array.from(map.values());
    }

    if (db === "postgres" || db === "cockroachdb") {
      const map = new Map<
        string,
        { name: string; columns: string[]; isUnique: boolean }
      >();
      for (const r of rows) {
        const key = r.index_name;
        const isUnique = !!r.is_unique;
        const arr = map.get(key) || {
          name: key,
          columns: [] as string[],
          isUnique,
        };
        arr.columns.push(r.column_name);
        map.set(key, arr);
      }
      return Array.from(map.values());
    }

    // sqlite: PRAGMA index_list returns name, unique; need per-index columns via PRAGMA index_info(name)
    const result: TableIndexInfo[] = [];
    for (const r of rows) {
      const name = r.name;
      const isUnique = !!r.unique;
      const colsRows: any[] = await this.rawQuery(`PRAGMA index_info(${name})`);
      const columns = colsRows.map((cr) => cr.name);
      result.push({ name, columns, isUnique });
    }
    return result;
  }

  async getForeignKeyInfo(table: string): Promise<TableForeignKeyInfo[]> {
    const ast = new AstParser(
      {
        table,
        databaseCaseConvention: "preserve",
        modelCaseConvention: "preserve",
      } as typeof Model,
      this.getDbType(),
    );

    const sql = ast.parse([new ForeignKeyInfoNode(table)]).sql;
    const rows: any[] = await this.rawQuery(sql);

    const db = this.getDbType();
    if (db === "sqlite") {
      const grouped = new Map<number, TableForeignKeyInfo>();
      for (const r of rows) {
        const id = Number(r.id);
        const fk = grouped.get(id) || {
          name: undefined,
          columns: [] as string[],
          referencedTable: String(r.table),
          referencedColumns: [] as string[],
          onDelete: r.on_delete ?? null,
          onUpdate: r.on_update ?? null,
        };

        fk.columns.push(String(r.from));
        fk.referencedColumns.push(String(r.to));
        grouped.set(id, fk);
      }
      return Array.from(grouped.values());
    }

    const map = new Map<string, TableForeignKeyInfo>();
    for (const row of rows) {
      const name = String(row.name || "");
      const key = name || `${row.referenced_table}_${row.column_name}`;
      const fk = map.get(key) || {
        name: name || undefined,
        columns: [] as string[],
        referencedTable: String(row.referenced_table),
        referencedColumns: [] as string[],
        onDelete: row.on_delete ?? null,
        onUpdate: row.on_update ?? null,
      };

      fk.columns.push(String(row.column_name));
      fk.referencedColumns.push(String(row.referenced_column));
      map.set(key, fk);
    }

    return Array.from(map.values());
  }

  private async testConnectionQuery(query: string): Promise<void> {
    await execSql(query, [], this, "raw", {
      shouldNotLog: true,
    });
  }

  private sanitizeModelKeys(
    models: Record<string, SqlDataSourceModel>,
  ): Record<string, SqlDataSourceModel> {
    const instanceKeys = Object.getOwnPropertyNames(this);
    const staticKeys = Object.getOwnPropertyNames(this.constructor);
    const allKeys = [...instanceKeys, ...staticKeys];

    if (Object.keys(models).some((key) => allKeys.includes(key))) {
      throw new HysteriaError(
        "SqlDataSource::sanitizeModelKeys",
        "DUPLICATE_MODEL_KEYS_WHILE_INSTANTIATING_MODELS",
        new Error(
          `Duplicate model keys while instantiating models inside the connection: ${Object.keys(
            models,
          )
            .filter((key) => allKeys.includes(key))
            .map((key) => `"${key}"`)
            .join(", ")}`,
        ),
      );
    }

    return models;
  }

  static get isInGlobalTransaction(): boolean {
    return !!this.instance?.globalTransaction;
  }

  get isInGlobalTransaction(): boolean {
    return !!this.globalTransaction;
  }

  /**
   * @description Returns the models registered on this SqlDataSource instance (as provided in connect input)
   */
  get registeredModels(): Record<string, typeof Model> {
    return this.models;
  }
}
