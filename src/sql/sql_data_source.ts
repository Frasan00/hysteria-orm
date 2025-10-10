import { DataSource } from "../data_source/data_source";
import { HysteriaError } from "../errors/hysteria_error";
import { generateOpenApiModelWithMetadata } from "../openapi/openapi";
import logger, { log } from "../utils/logger";
import {
  formatQuery,
  getSqlDialect,
  isTableMissingError,
} from "../utils/query";
import { AstParser } from "./ast/parser";
import { RawNode } from "./ast/query/node/raw/raw_node";
import { ForeignKeyInfoNode } from "./ast/query/node/schema";
import { IndexInfoNode } from "./ast/query/node/schema/index_info";
import { PrimaryKeyInfoNode } from "./ast/query/node/schema/primary_key_info";
import { TableInfoNode } from "./ast/query/node/schema/table_info";
import Schema from "./migrations/schema/schema";
import { SchemaDiff } from "./migrations/schema_diff/schema_diff";
import { normalizeColumnType } from "./migrations/schema_diff/type_normalizer";
import { Model } from "./models/model";
import { ModelManager } from "./models/model_manager/model_manager";
import { RawModelOptions } from "./models/model_types";
import { DryQueryBuilder } from "./query_builder/dry_query_builder";
import { QueryBuilder } from "./query_builder/query_builder";
import { DryQueryBuilderWithoutReadOperations } from "./query_builder/query_builder_types";
import { getRawQueryBuilderModel } from "./query_builder/query_builder_utils";
import type {
  TableColumnInfo,
  TableForeignKeyInfo,
  TableIndexInfo,
  TablePrimaryKeyInfo,
  TableSchemaInfo,
} from "./schema_introspection_types";
import { createSqlPool } from "./sql_connection_utils";
import type {
  AugmentedSqlDataSource,
  ConnectionPolicies,
  GetConnectionReturnType,
  getPoolReturnType,
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlCloneOptions,
  SqlDataSourceInput,
  SqlDataSourceModel,
  SqlDataSourceType,
  SqliteConnectionInstance,
  SqlPoolType,
  TableFormat,
  UseConnectionInput,
} from "./sql_data_source_types";
import { execSql } from "./sql_runner/sql_runner";
import { Transaction } from "./transactions/transaction";
import {
  StartTransactionOptions,
  StartTransactionReturnType,
  TransactionExecutionOptions,
  TransactionOptionsOrCallback,
} from "./transactions/transaction_types";

/**
 * @description The SqlDataSource class is the main class for interacting with the database, it's used to create connections, execute queries, and manage transactions
 */
export class SqlDataSource extends DataSource {
  private static instance: SqlDataSource | null = null;
  private globalTransaction: Transaction | null = null;
  private sqlType: SqlDataSourceType;
  private models: Record<string, SqlDataSourceModel> = {};
  private ownsPool: boolean = false;

  /**
   * @description The pool of connections for the database
   */
  declare sqlPool: SqlPoolType | null;

  /**
   * @description Only used in transaction context to specify the connection, not meant to be used directly
   * @private
   */
  sqlConnection: GetConnectionReturnType<SqlDataSourceType> | null = null;

  /**
   * @description Options provided in the sql data source initialization
   */
  inputDetails: SqlDataSourceInput<SqlDataSourceType>;

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
  static async connect<
    U extends SqlDataSourceType,
    T extends Record<string, SqlDataSourceModel> = {},
  >(
    input: SqlDataSourceInput<U, T>,
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<AugmentedSqlDataSource<T>>;
  static async connect<T extends Record<string, SqlDataSourceModel> = {}>(
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connect<
    U extends SqlDataSourceType,
    T extends Record<string, SqlDataSourceModel> = {},
  >(
    inputOrCb?:
      | SqlDataSourceInput<U, T>
      | ((sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void),
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<AugmentedSqlDataSource<T>> {
    if (typeof inputOrCb === "function") {
      cb = inputOrCb;
      inputOrCb = undefined;
    }

    const sqlDataSource = new SqlDataSource(
      inputOrCb as SqlDataSourceInput<U, T>,
    );

    if (inputOrCb?.models) {
      const sanitizeModelKeys = sqlDataSource.sanitizeModelKeys(
        inputOrCb?.models || {},
      );

      Object.assign(sqlDataSource, sanitizeModelKeys);
    }

    sqlDataSource.models = inputOrCb?.models || {};
    sqlDataSource.sqlPool = await createSqlPool(sqlDataSource.sqlType, {
      type: sqlDataSource.sqlType,
      host: sqlDataSource.host,
      port: sqlDataSource.port,
      username: sqlDataSource.username,
      password: sqlDataSource.password,
      database: sqlDataSource.database,
      connectionPolicies: sqlDataSource.inputDetails
        .connectionPolicies as ConnectionPolicies,
      queryFormatOptions: sqlDataSource.inputDetails.queryFormatOptions,
      driverOptions: sqlDataSource.inputDetails.driverOptions,
      logs: sqlDataSource.logs,
      models: sqlDataSource.models,
    } as SqlDataSourceInput<U, T>);

    sqlDataSource.ownsPool = true;
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
   * const user = await User.query({ connection: anotherSql }).many();
   * ```
   */
  static async connectToSecondarySource<
    U extends SqlDataSourceType,
    T extends Record<string, SqlDataSourceModel> = {},
  >(
    input: SqlDataSourceInput<U, T>,
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<AugmentedSqlDataSource<T>>;
  static async connectToSecondarySource<
    T extends Record<string, SqlDataSourceModel> = {},
  >(
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connectToSecondarySource<
    U extends SqlDataSourceType,
    T extends Record<string, SqlDataSourceModel> = {},
  >(
    inputOrCb?:
      | SqlDataSourceInput<U, T>
      | ((sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void),
    cb?: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void> | void,
  ): Promise<AugmentedSqlDataSource<T>> {
    if (typeof inputOrCb === "function") {
      cb = inputOrCb;
      inputOrCb = undefined;
    }

    const sqlDataSource = new SqlDataSource(
      inputOrCb as SqlDataSourceInput<U, T>,
    );

    if (inputOrCb?.models) {
      const sanitizeModelKeys = sqlDataSource.sanitizeModelKeys(
        inputOrCb.models,
      );

      Object.assign(sqlDataSource, sanitizeModelKeys);
    }

    sqlDataSource.models = inputOrCb?.models || {};
    sqlDataSource.sqlPool = await createSqlPool(sqlDataSource.sqlType, {
      type: sqlDataSource.sqlType,
      host: sqlDataSource.host,
      port: sqlDataSource.port,
      username: sqlDataSource.username,
      password: sqlDataSource.password,
      database: sqlDataSource.database,
      connectionPolicies: sqlDataSource.inputDetails
        .connectionPolicies as ConnectionPolicies,
      queryFormatOptions: sqlDataSource.inputDetails.queryFormatOptions,
      driverOptions: sqlDataSource.inputDetails.driverOptions,
      logs: sqlDataSource.logs,
      models: sqlDataSource.models,
    } as SqlDataSourceInput<U, T>);
    sqlDataSource.ownsPool = true;

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
   *    const user = await User.query({ connection: sql }).many();
   * });
   * ```
   */
  static async useConnection<
    U extends SqlDataSourceType,
    T extends Record<string, SqlDataSourceModel> = {},
  >(
    connectionDetails: UseConnectionInput<U, T>,
    cb: (sqlDataSource: AugmentedSqlDataSource<T>) => Promise<void>,
  ): Promise<void> {
    const customSqlInstance = new SqlDataSource(
      connectionDetails as SqlDataSourceInput<U, T>,
    );

    if (connectionDetails.models) {
      const sanitizeModelKeys = customSqlInstance.sanitizeModelKeys(
        connectionDetails.models,
      );

      Object.assign(customSqlInstance, sanitizeModelKeys);
    }

    customSqlInstance.models = connectionDetails.models || {};
    customSqlInstance.sqlPool = await createSqlPool(customSqlInstance.sqlType, {
      type: customSqlInstance.sqlType,
      host: customSqlInstance.host,
      port: customSqlInstance.port,
      username: customSqlInstance.username,
      password: customSqlInstance.password,
      database: customSqlInstance.database,
      connectionPolicies: customSqlInstance.inputDetails
        .connectionPolicies as ConnectionPolicies,
      queryFormatOptions: customSqlInstance.inputDetails.queryFormatOptions,
      driverOptions: customSqlInstance.inputDetails.driverOptions,
      logs: customSqlInstance.logs,
      models: connectionDetails.models,
    } as SqlDataSourceInput<U, T>);

    customSqlInstance.ownsPool = true;
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
   * @description Default soft delete column is "deleted_at" with stringed date value
   * @param table The table name to query from, must be in valid sql format `table` or `table as alias`
   */
  static query<S extends string>(
    table: TableFormat<S>,
    options?: RawModelOptions,
  ): QueryBuilder {
    const instance = this.getInstance();
    const sqlForQueryBuilder =
      instance.isInGlobalTransaction && instance.globalTransaction?.isActive
        ? instance.globalTransaction.sql
        : instance;

    const qb = new QueryBuilder(
      getRawQueryBuilderModel(table, options),
      sqlForQueryBuilder as SqlDataSource,
    );

    if (options?.alias) {
      qb.from(table, options.alias);
    }

    return qb;
  }

  /**
   * @description Returns a dry query builder instance
   * @description The dry query builder instance will not execute the query, it will return the query statement
   * @returns The dry query builder instance
   */
  static dryQuery<S extends string>(
    table: TableFormat<S>,
    options?: RawModelOptions,
  ): DryQueryBuilderWithoutReadOperations {
    const instance = this.getInstance();
    const sqlForQueryBuilder =
      instance.isInGlobalTransaction && instance.globalTransaction?.isActive
        ? instance.globalTransaction.sql
        : instance;

    const qb = new DryQueryBuilder(
      getRawQueryBuilderModel(table, options),
      sqlForQueryBuilder as SqlDataSource,
    );

    if (options?.alias) {
      qb.from(table, options.alias);
    }

    return qb;
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
   * @description Starts a transaction on a dedicated connection from the pool and returns a Transaction instance
   * @param cb if a callback is provided, it will execute the callback and commit or rollback the transaction based on the callback's success or failure
   * @param options.isolationLevel The isolation level to use for the transaction
   * @param options.throwErrorOnInactiveTransaction Whether to throw an error if the transaction is not active
   * @param options.endConnection Whether to end the connection after the transaction is committed or rolled back (Default is true, better to leave it this way)
   * @sqlite ignores the isolation level
   */
  static async startTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction>;
  static async startTransaction(
    cb: (trx: Transaction) => Promise<void>,
    options?: StartTransactionOptions,
  ): Promise<void>;
  static async startTransaction<T extends TransactionOptionsOrCallback>(
    optionsOrCb?: T,
    maybeOptions?: StartTransactionOptions,
  ): Promise<StartTransactionReturnType<T>> {
    return this.getInstance().startTransaction(
      optionsOrCb as any,
      maybeOptions,
    ) as unknown as StartTransactionReturnType<T>;
  }

  /**
   * @alias startTransaction
   * @param cb if a callback is provided, it will execute the callback and commit or rollback the transaction based on the callback's success or failure
   * @param options.isolationLevel The isolation level to use for the transaction
   * @param options.throwErrorOnInactiveTransaction Whether to throw an error if the transaction is not active
   * @param options.endConnection Whether to end the connection after the transaction is committed or rolled back (Default is true, better to leave it this way)
   * @sqlite ignores the isolation level
   */
  static async transaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction>;
  static async transaction(
    cb: (trx: Transaction) => Promise<void>,
    options?: StartTransactionOptions,
  ): Promise<void>;
  static async transaction(
    optionsOrCb?:
      | StartTransactionOptions
      | ((trx: Transaction) => Promise<void>),
    maybeOptions?: StartTransactionOptions,
  ): Promise<StartTransactionReturnType<TransactionOptionsOrCallback>>;
  static async transaction<T extends TransactionOptionsOrCallback>(
    optionsOrCb?: T,
    maybeOptions?: StartTransactionOptions,
  ): Promise<StartTransactionReturnType<T>> {
    const options =
      typeof optionsOrCb === "function" ? maybeOptions : optionsOrCb;
    return this.getInstance().startTransaction(
      optionsOrCb as any,
      options as any,
    ) as unknown as StartTransactionReturnType<T>;
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

    await this.instance.closeConnection();
    this.instance = null;
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
    const instance = this.getInstance();
    const sqlForRawQuery =
      instance.isInGlobalTransaction && instance.globalTransaction?.isActive
        ? instance.globalTransaction.sql
        : instance;

    return sqlForRawQuery.rawQuery(query, params);
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
  private constructor(input?: SqlDataSourceInput<SqlDataSourceType>) {
    super(input);
    this.sqlType = this.type as SqlDataSourceType;
    this.inputDetails = input || {
      connectionPolicies: {
        retry: {
          maxRetries: 0,
          delay: 0,
        },
      },
      queryFormatOptions: {
        language: getSqlDialect(this.sqlType),
        keywordCase: "lower",
        dataTypeCase: "lower",
        functionCase: "lower",
      },
    };

    this.inputDetails.connectionPolicies = input?.connectionPolicies || {
      retry: {
        maxRetries: 0,
        delay: 0,
      },
    };

    this.inputDetails.queryFormatOptions = input?.queryFormatOptions || {
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
    return !!this.sqlPool || !!this.sqlConnection;
  }

  /**
   * @description Clones the SqlDataSource instance
   * @param options.shouldRecreatePool Whether to recreate the pool of connections for the given driver, by default it's false
   * @sqlite ignores the shouldRecreatePool option
   * @returns A new SqlDataSource instance with the same input details
   */
  async clone(options?: SqlCloneOptions): Promise<this> {
    const cloned = new SqlDataSource(this.inputDetails) as this;
    const mustCreateNewPool =
      cloned.sqlType === "sqlite" || !!options?.shouldRecreatePool;
    if (mustCreateNewPool) {
      cloned.sqlPool = await createSqlPool(cloned.sqlType, {
        type: cloned.sqlType,
        host: cloned.host,
        port: cloned.port,
        username: cloned.username,
        password: cloned.password,
        database: cloned.database,
        connectionPolicies: cloned.inputDetails
          .connectionPolicies as ConnectionPolicies,
        queryFormatOptions: cloned.inputDetails.queryFormatOptions,
        driverOptions: cloned.inputDetails.driverOptions,
        logs: cloned.logs,
        models: cloned.models,
      } as SqlDataSourceInput<SqlDataSourceType>);

      cloned.ownsPool = true;

      if (Object.keys(this.models).length) {
        const sanitizeModelKeys = cloned.sanitizeModelKeys(this.models);
        Object.assign(cloned, sanitizeModelKeys);
      }

      return cloned;
    }

    cloned.sqlPool = this.sqlPool;
    cloned.ownsPool = false;

    if (Object.keys(this.models).length) {
      const sanitizeModelKeys = cloned.sanitizeModelKeys(this.models);
      Object.assign(cloned, sanitizeModelKeys);
    }

    return cloned;
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
   * @description Default soft delete column is "deleted_at" with stringed date value
   * @param table The table name to query from, must be in valid sql format `table` or `table as alias`
   */
  query<S extends string>(
    table: TableFormat<S>,
    options?: RawModelOptions,
  ): QueryBuilder {
    const sqlForQueryBuilder =
      this.isInGlobalTransaction && this.globalTransaction?.isActive
        ? this.globalTransaction.sql
        : this;

    const qb = new QueryBuilder(
      getRawQueryBuilderModel(table, options),
      sqlForQueryBuilder as SqlDataSource,
    );

    if (options?.alias) {
      qb.from(table, options.alias);
    }

    return qb;
  }

  /**
   * @description Returns a DryQueryBuilder instance
   * @description The dry query builder instance will not execute the query, it will return the query statement
   * @returns The dry query builder instance
   */
  dryQuery<S extends string>(
    table: TableFormat<S>,
    options?: RawModelOptions,
  ): DryQueryBuilderWithoutReadOperations {
    return new DryQueryBuilder(getRawQueryBuilderModel(table, options), this);
  }

  /**
   * @description Return the query to alter the given table schema
   */
  alterTable(...args: Parameters<Schema["alterTable"]>): string[] {
    const schema = new Schema(this.getDbType());
    schema.alterTable(...args);
    return schema.queryStatements;
  }

  /**
   * @description Return the query to create the given table schema
   */
  createTable(...args: Parameters<Schema["createTable"]>): string {
    const schema = new Schema(this.getDbType());
    schema.createTable(...args);
    return schema.queryStatements[0] || "";
  }

  /**
   * @description Starts a global transaction on the database on the main connection pool, intended to for testing purposes only, don't use it in production
   */
  async startGlobalTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction> {
    const cloned = await this.clone();
    cloned.sqlConnection = await cloned.getConnection();
    this.globalTransaction = new Transaction(cloned, options?.isolationLevel);
    await this.globalTransaction.startTransaction();
    return this.globalTransaction;
  }

  /**
   * @description Commits a global transaction on the database on the main connection pool, intended to for testing purposes only, don't use it in production
   * @throws {HysteriaError} If the global transaction is not started
   */
  async commitGlobalTransaction(
    options?: TransactionExecutionOptions,
  ): Promise<void> {
    if (!this.globalTransaction) {
      throw new HysteriaError(
        "SqlDataSource::commitGlobalTransaction",
        "GLOBAL_TRANSACTION_NOT_STARTED",
      );
    }

    await this.globalTransaction.commit({
      throwErrorOnInactiveTransaction: options?.throwErrorOnInactiveTransaction,
    });
    this.globalTransaction = null;
  }

  /**
   * @description Rolls back a global transaction on the database on the main connection pool, intended to for testing purposes only, don't use it in production
   * @throws {HysteriaError} If the global transaction is not started and options.throwErrorOnInactiveTransaction is true
   */
  async rollbackGlobalTransaction(
    options?: TransactionExecutionOptions,
  ): Promise<void> {
    if (!this.globalTransaction) {
      logger.warn(
        "SqlDataSource::rollbackGlobalTransaction - GLOBAL_TRANSACTION_NOT_STARTED",
      );
      return;
    }

    await this.globalTransaction.rollback({
      throwErrorOnInactiveTransaction: options?.throwErrorOnInactiveTransaction,
    });
    this.globalTransaction = null;
  }

  /**
   * @description Get's a connection from the pool and starts a transaction on the database and returns an already started transaction instance
   * @param cb if a callback is provided, it will execute the callback and commit or rollback the transaction based on the callback's success or failure
   * @param options.isolationLevel The isolation level to use for the transaction
   * @param options.throwErrorOnInactiveTransaction Whether to throw an error if the transaction is not active
   * @param options.endConnection Whether to end the connection after the transaction is committed or rolled back (Default is true, better to leave it this way)
   * @sqlite ignores the isolation level
   */
  async startTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction>;
  async startTransaction(
    cb: (trx: Transaction) => Promise<void>,
    options?: StartTransactionOptions,
  ): Promise<void>;
  async startTransaction<T extends TransactionOptionsOrCallback>(
    optionsOrCb?:
      | StartTransactionOptions
      | ((trx: Transaction) => Promise<void>),
    maybeOptions?: StartTransactionOptions,
  ): Promise<StartTransactionReturnType<T>> {
    const options =
      typeof optionsOrCb === "function" ? maybeOptions : optionsOrCb;
    const cloned = await this.clone();
    cloned.sqlConnection = await cloned.getConnection();
    const sqlTrx = new Transaction(cloned, options?.isolationLevel);
    await sqlTrx.startTransaction();

    if (typeof optionsOrCb === "function") {
      try {
        await optionsOrCb(sqlTrx);
        await sqlTrx.commit({
          throwErrorOnInactiveTransaction: false,
        });
        return undefined as StartTransactionReturnType<T>;
      } catch (error) {
        await sqlTrx.rollback({
          throwErrorOnInactiveTransaction: false,
        });
        throw error;
      }
    }

    return sqlTrx as StartTransactionReturnType<T>;
  }

  /**
   * @alias startTransaction
   * @description Get's a connection from the pool and starts a transaction on the database and returns an already started transaction instance
   * @param cb if a callback is provided, it will execute the callback and commit or rollback the transaction based on the callback's success or failure
   * @param options.isolationLevel The isolation level to use for the transaction
   * @param options.throwErrorOnInactiveTransaction Whether to throw an error if the transaction is not active
   * @param options.endConnection Whether to end the connection after the transaction is committed or rolled back (Default is true, better to leave it this way)
   * @sqlite ignores the isolation level
   */
  async transaction(options?: StartTransactionOptions): Promise<Transaction>;
  async transaction(
    cb: (trx: Transaction) => Promise<void>,
    options?: StartTransactionOptions,
  ): Promise<void>;
  async transaction(
    optionsOrCb?:
      | StartTransactionOptions
      | ((trx: Transaction) => Promise<void>),
    maybeOptions?: StartTransactionOptions,
  ): Promise<Transaction | void> {
    return this.startTransaction(optionsOrCb as any, maybeOptions);
  }

  /**
   * @description Returns a ModelManager instance for the given model, it's advised to use Model static methods instead.
   * @description This is intended to use only if you do not want to use active record pattern
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

    if (this.globalTransaction?.isActive) {
      return new ModelManager(
        model as typeof Model,
        this.globalTransaction.sql as SqlDataSource,
      );
    }

    return new ModelManager(model as typeof Model, this);
  }

  /**
   * @description Returns the current raw driver Pool, you can specify the type of connection you want to get to have better type safety
   * @throws {HysteriaError} If the connection pool is not established
   * @example
   * const mysqlConnection = sql.getPool("mysql"); // mysql2 Pool
   * const pgConnection = sql.getPool("postgres"); // pg Pool
   * const sqliteConnection = sql.getPool("sqlite"); // sqlite3 Database
   */
  getPool<T extends SqlDataSourceType = typeof this.sqlType>(
    _specificType: T = this.sqlType as T,
  ): getPoolReturnType<T> {
    if (!this.sqlPool) {
      throw new HysteriaError(
        "SqlDataSource::getPool",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return this.sqlPool as getPoolReturnType<T>;
  }

  /**
   * @description Returns a connection from the pool, you can specify the type of connection you want to get to have better type safety
   * @throws {HysteriaError} If the connection is not established
   * @example
   * const mysqlConnection = sql.getConnection("mysql"); // mysql2 PoolConnection
   * const pgConnection = sql.getConnection("postgres"); // pg PoolClient
   * const sqliteConnection = sql.getConnection("sqlite"); // sqlite3 Database
   */
  async getConnection<T extends SqlDataSourceType = typeof this.sqlType>(
    _specificType: T = this.sqlType as T,
  ): Promise<GetConnectionReturnType<T>> {
    if (this.sqlConnection) {
      return this.sqlConnection as GetConnectionReturnType<T>;
    }

    if (!this.sqlPool) {
      throw new HysteriaError(
        "SqlDataSource::getConnection",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        const mysqlPool = this.sqlPool as MysqlConnectionInstance;
        return (await mysqlPool.getConnection()) as GetConnectionReturnType<T>;
      case "postgres":
      case "cockroachdb":
        const pgPool = this.sqlPool as PgPoolClientInstance;
        return (await pgPool.connect()) as GetConnectionReturnType<T>;
      case "sqlite":
        return this.sqlPool as GetConnectionReturnType<T>;
      default:
        throw new HysteriaError(
          "SqlDataSource::getConnection",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Closes the current connection
   * @description If there is an active global transaction, it will be rolled back
   */
  async closeConnection(): Promise<void> {
    if (!this.isConnected) {
      log("Connection already closed or not established", this.logs);
      return;
    }

    if (!this.ownsPool) {
      this.sqlConnection = null;
      return;
    }

    try {
      if (this.globalTransaction?.isActive) {
        await this.rollbackGlobalTransaction({
          throwErrorOnInactiveTransaction: false,
        });
      }
    } catch (err: any) {
      logger.warn(
        "SqlDataSource::closeConnection - Error while rolling back global transaction",
      );
    }

    log("Closing connection", this.logs);
    switch (this.type) {
      case "mysql":
      case "mariadb":
        await (this.sqlPool as MysqlConnectionInstance).end();
        break;
      case "postgres":
      case "cockroachdb":
        await (this.sqlPool as PgPoolClientInstance).end();
        break;
      case "sqlite":
        await new Promise<void>((resolve, reject) => {
          (this.sqlPool as SqliteConnectionInstance).close((err) => {
            if (err) {
              reject(err);
            }
            resolve();
          });
        });
        break;
      default:
        throw new HysteriaError(
          "SqlDataSource::closeConnection",
          `UNSUPPORTED_DATABASE_TYPE_${this.type}`,
        );
    }

    this.sqlPool = null;
    this.sqlConnection = null;
  }

  getConnectionDetails(): SqlDataSourceInput<SqlDataSourceType> {
    return {
      type: this.getDbType(),
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      connectionPolicies: this.inputDetails
        .connectionPolicies as ConnectionPolicies,
      queryFormatOptions: this.inputDetails.queryFormatOptions,
    };
  }

  /**
   * @alias closeConnection
   */
  async disconnect(): Promise<void> {
    return this.closeConnection();
  }

  /**
   * @description Syncs the schema of the database with the models metadata
   * @warning This will drop and recreate all the indexes and constraints, use with caution and not in production environments
   * @param options.transactional Whether to use a transaction to sync the schema, if true it will use a transaction for the entire sync operation, defaults to false
   * @sqlite Not supported but won't throw an error
   */
  async syncSchema(options?: { transactional: boolean }): Promise<void> {
    options = options || { transactional: false };

    if (this.sqlType === "sqlite") {
      logger.warn("Syncing schema with SQLite is not supported, skipping...");
      return;
    }

    const diff = await SchemaDiff.makeDiff(this);
    const sqlStatements = diff.getSqlStatements();
    if (!sqlStatements.length) {
      logger.info(
        `No new changes detected between database schema and models metadata`,
      );
      return;
    }

    logger.info(
      `Generated ${sqlStatements.length} SQL statements to sync schema`,
    );

    if (!options?.transactional) {
      for (const sql of sqlStatements) {
        await this.rawQuery(sql);
      }

      logger.info(`Synced schema with ${sqlStatements.length} SQL statements`);
      return;
    }

    await this.transaction(async (trx) => {
      for (const sql of sqlStatements) {
        await trx.sql.rawQuery(sql);
      }
    });
    logger.info(`Synced schema with ${sqlStatements.length} SQL statements`);
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

    const formattedQuery = formatQuery(this, query);
    return execSql(formattedQuery, params, this, "raw");
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
   * @description Retrieves information from the database for the given table
   */
  async getTableSchema(table: string): Promise<TableSchemaInfo> {
    const [columns, indexes, foreignKeys, primaryKey] = await Promise.all([
      this.getTableInfo(table),
      this.getIndexInfo(table),
      this.getForeignKeyInfo(table),
      this.getPrimaryKeyInfo(table),
    ]);

    return { columns, indexes, foreignKeys, primaryKey };
  }

  /**
   * @description Models provided inside the connection method will always be used for openapi schema generation
   * @experimental
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
    let rows: any[] = [];
    try {
      rows = await this.rawQuery(sql);
    } catch (err: any) {
      if (isTableMissingError(this.getDbType(), err)) {
        return [];
      }
      throw err;
    }
    const db = this.getDbType();
    if (db === "sqlite") {
      return rows.map((r: any) => {
        const rawType = String(r.type || "").toLowerCase();
        const dataType = normalizeColumnType(db, rawType);
        return {
          name: r.name,
          dataType,
          isNullable: r.notnull === 0,
          defaultValue: r.dflt_value ?? null,
          withTimezone: null,
        };
      });
    }

    return rows.map((r: any) => {
      const name = String(r.column_name || r.COLUMN_NAME || r.name || "");
      const rawType = String(
        r.data_type || r.DATA_TYPE || r.type || "",
      ).toLowerCase();
      const dataType = normalizeColumnType(db, rawType);
      const rawNullable =
        r.is_nullable !== undefined
          ? r.is_nullable
          : r.IS_NULLABLE !== undefined
            ? r.IS_NULLABLE
            : undefined;
      const isNullable = (() => {
        if (typeof rawNullable === "string") {
          return rawNullable.toLowerCase() !== "no";
        }
        if (typeof rawNullable === "boolean") {
          return rawNullable;
        }
        if (r.notnull !== undefined) {
          return r.notnull === 0;
        }
        return true;
      })();

      const defaultValue =
        r.column_default ??
        r.COLUMN_DEFAULT ??
        r.defaultValue ??
        r.dflt_value ??
        null;
      const length = r.char_length != null ? Number(r.char_length) : null;
      const precision =
        r.numeric_precision != null ? Number(r.numeric_precision) : null;
      const scale = r.numeric_scale != null ? Number(r.numeric_scale) : null;
      const withTimezone =
        r.timezone != null
          ? Boolean(r.timezone)
          : typeof r.datetime_precision === "number"
            ? /with time zone/.test(
                String(r.column_type || r.udt_name || "").toLowerCase(),
              )
            : /with time zone/.test(
                String(r.column_type || r.udt_name || "").toLowerCase(),
              );
      return {
        name,
        dataType,
        isNullable,
        defaultValue,
        length,
        precision,
        scale,
        withTimezone,
      };
    });
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
    let rows: any[] = [];
    try {
      rows = await this.rawQuery(sql);
    } catch (err: any) {
      if (isTableMissingError(this.getDbType(), err)) {
        return [];
      }
      throw err;
    }
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
    let rows: any[] = [];
    try {
      rows = await this.rawQuery(sql);
    } catch (err: any) {
      if (isTableMissingError(this.getDbType(), err)) {
        return [];
      }
      throw err;
    }

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

  /**
   * @description Introspects table primary key from the database
   */
  async getPrimaryKeyInfo(
    table: string,
  ): Promise<TablePrimaryKeyInfo | undefined> {
    const ast = new AstParser(
      {
        table,
        databaseCaseConvention: "preserve",
        modelCaseConvention: "preserve",
      } as typeof Model,
      this.getDbType(),
    );

    const sql = ast.parse([new PrimaryKeyInfoNode(table)]).sql;
    let rows: any[] = [];
    try {
      rows = await this.rawQuery(sql);
    } catch (err: any) {
      if (isTableMissingError(this.getDbType(), err)) {
        return undefined;
      }
      throw err;
    }

    if (!rows.length) {
      return undefined;
    }

    const columns = rows.map((row) => String(row.column_name));
    const name = rows[0].name;

    return {
      name: name || undefined,
      columns,
    };
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
