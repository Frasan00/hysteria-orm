import {
  initializeAdminJs,
  initializeAdminJsExpress,
} from "../adminjs/adminjs_adapter";
import type {
  AdminJsAdminInstance,
  AdminJsInstance,
  AdminJsOptions,
} from "../adminjs/adminjs_types";
import { InMemoryAdapter } from "../cache/adapters/in_memory";
import { CacheAdapter } from "../cache/cache_adapter";
import { CacheKeys, UseCacheReturnType } from "../cache/cache_types";
import { DataSource } from "../data_source/data_source";
import { env } from "../env/env";
import { HysteriaError } from "../errors/hysteria_error";
import { generateOpenApiModelWithMetadata } from "../openapi/openapi";
import { hashString } from "../utils/hash";
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
  ConnectionPolicies,
  GetConnectionReturnType,
  getPoolReturnType,
  MssqlPoolInstance,
  MysqlConnectionInstance,
  OracleDBPoolInstance,
  PgPoolClientInstance,
  RawQueryOptions,
  SlaveAlgorithm,
  SlaveContext,
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
import { RawQueryResponseType } from "./sql_runner/sql_runner_types";
import { Transaction } from "./transactions/transaction";
import {
  StartTransactionOptions,
  StartTransactionReturnType,
  TransactionExecutionOptions,
  TransactionOptionsOrCallback,
} from "./transactions/transaction_types";

/**
 * @description The SqlDataSource class is the main class for interacting with the database, it's used to create connections, execute queries, and manage transactions
 * @example
 * ```ts
 * // Create and connect to a database
 * const sql = new SqlDataSource({
 *   type: "mysql",
 *   host: "localhost",
 *   username: "root",
 *   password: "password",
 *   database: "mydb",
 *   models: { User, Post }
 * });
 * await sql.connect();
 *
 * // Now you can use the connection
 * const users = await sql.query("users").many();
 * ```
 */
export class SqlDataSource<
  D extends SqlDataSourceType = SqlDataSourceType,
  T extends Record<string, SqlDataSourceModel> = {},
  C extends CacheKeys = {},
> extends DataSource {
  static #instance: SqlDataSource | null = null;
  private globalTransaction: Transaction | null = null;
  private sqlType: D;
  private _models: T;
  private ownsPool: boolean = false;

  /**
   * @description The slaves data sources to use for the sql data source, slaves are automatically used for read operations unless specified otherwise
   */
  slaves: SqlDataSource<D, T, C>[];

  /**
   * @description The algorithm to use for selecting the slave for read operations
   * @default "roundRobin" - Distributes requests evenly across all slaves in sequence
   * @option "random" - Randomly selects a slave for each request
   */
  slaveAlgorithm: SlaveAlgorithm;

  /**
   * @description The current index for round-robin slave selection
   * @private
   */
  private roundRobinIndex: number = 0;

  /**
   * @description The pool of connections for the database
   */
  declare sqlPool: SqlPoolType | null;

  /**
   * @description Only used in transaction context to specify the connection, not meant to be used directly
   * @private
   */
  sqlConnection: GetConnectionReturnType<D> | null = null;

  /**
   * @description Options provided in the sql data source initialization
   */
  inputDetails: SqlDataSourceInput<D, T, C>;

  /**
   * @description Adapter for `useCache`, uses an in memory strategy by default
   */
  cacheAdapter: CacheAdapter = new InMemoryAdapter();

  /**
   * @description Maps global keys to specific handlers for cache handling
   */
  cacheKeys: C;

  /**
   * @description The path to the migrations folder for the sql data source, it's used to configure the migrations path for the sql data source
   */
  migrationsPath: string = env.MIGRATION_PATH || "database/migrations";

  /**
   * @description AdminJS configuration options
   */
  private adminJsOptions?: AdminJsOptions;

  /**
   * @description Cached AdminJS instance
   */
  private adminJsInstance?: AdminJsInstance;

  /**
   * @description Callback to handle slave server failures
   */
  private onSlaveServerFailure?: (
    error: Error,
    context: SlaveContext,
  ) => void | Promise<void>;

  /**
   * @description Returns the configured slave failure callback
   */
  getOnSlaveServerFailure() {
    return this.onSlaveServerFailure;
  }

  // ============================================
  // Static Methods
  // ============================================

  /**
   * @description Returns the primary instance of the SqlDataSource (set via connect with setPrimary: true)
   * All models by default will use this instance to execute queries unless you pass a different connection/transaction in the query options
   */
  static get instance(): SqlDataSource {
    if (!this.#instance) {
      throw new HysteriaError(
        "SqlDataSource::instance",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return this.#instance;
  }

  /**
   * @description Creates a secondary database connection that won't be set as the primary instance
   * @description By default not used by the Models, you have to pass it as a parameter to the Models to use it
   * @example
   * ```ts
   * const secondaryDb = await SqlDataSource.connectToSecondarySource({
   *   type: "postgres",
   *   host: "replica.db.com",
   *   ...
   * });
   *
   * const user = await User.query({ connection: secondaryDb }).many();
   * ```
   */
  static async connectToSecondarySource<
    U extends SqlDataSourceType,
    M extends Record<string, SqlDataSourceModel> = {},
    K extends CacheKeys = {},
  >(
    input: Omit<SqlDataSourceInput<U, M, K>, "slaves">,
    cb?: (sqlDataSource: SqlDataSource<U, M, K>) => Promise<void> | void,
  ): Promise<SqlDataSource<U, M, K>> {
    const sqlDataSource = new SqlDataSource(
      input as SqlDataSourceInput<U, M, K>,
    );
    await sqlDataSource.connectWithoutSettingPrimary();
    const result = sqlDataSource as SqlDataSource<U, M, K>;
    await cb?.(result);
    return result;
  }

  /**
   * @description Creates a temporary connection that is automatically closed after the callback is executed
   * @example
   * ```ts
   * await SqlDataSource.useConnection({
   *   type: "mysql",
   *   ...connectionData
   * }, async (sql) => {
   *   const user = await User.query({ connection: sql }).many();
   * });
   * // Connection is automatically closed here
   * ```
   */
  static async useConnection<
    U extends SqlDataSourceType,
    M extends Record<string, SqlDataSourceModel> = {},
    K extends CacheKeys = {},
  >(
    connectionDetails: UseConnectionInput<U, M, K>,
    cb: (sqlDataSource: SqlDataSource<U, M, K>) => Promise<void>,
  ): Promise<void> {
    const sqlDataSource = new SqlDataSource(
      connectionDetails as SqlDataSourceInput<U, M, K>,
    );
    await sqlDataSource.connectWithoutSettingPrimary();

    const result = sqlDataSource as SqlDataSource<U, M, K>;

    try {
      await cb(result);
      if (sqlDataSource.isConnected) {
        await sqlDataSource.closeConnection();
      }
    } catch (error) {
      if (sqlDataSource.isConnected) {
        await sqlDataSource.closeConnection();
      }
      throw error;
    }
  }

  /**
   * @description Closes the primary connection (singleton instance)
   */
  static async closeConnection(): Promise<void> {
    if (!this.#instance) {
      logger.warn("Connection already closed");
      return;
    }

    await this.#instance.closeConnection();
    this.#instance = null;
  }

  /**
   * @alias closeConnection
   */
  static async disconnect(): Promise<void> {
    return this.closeConnection();
  }

  /**
   * @description Starts a global transaction on the primary database connection
   * @description Intended for testing purposes - wraps all operations in a transaction that can be rolled back
   */
  static async startGlobalTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction> {
    return this.instance.startGlobalTransaction(options);
  }

  /**
   * @description Commits a global transaction on the primary database connection
   * @throws {HysteriaError} If the global transaction is not started
   */
  static async commitGlobalTransaction(): Promise<void> {
    await this.instance.commitGlobalTransaction();
  }

  /**
   * @description Rolls back a global transaction on the primary database connection
   * @throws {HysteriaError} If the global transaction is not started
   */
  static async rollbackGlobalTransaction(): Promise<void> {
    await this.instance.rollbackGlobalTransaction();
  }

  /**
   * @description Returns true if the primary instance is in a global transaction
   */
  static get isInGlobalTransaction(): boolean {
    return !!this.#instance?.globalTransaction;
  }

  // ============================================
  // Constructor
  // ============================================

  /**
   * @description Creates a new SqlDataSource instance. Call `.connect()` to establish the connection.
   * @param input Configuration options for the database connection. If not provided, uses env variables.
   * @example
   * ```ts
   * // With explicit config
   * const sql = new SqlDataSource({
   *   type: "mysql",
   *   host: "localhost",
   *   username: "root",
   *   password: "password",
   *   database: "mydb",
   *   models: { User, Post }
   * });
   * await sql.connect();
   *
   * // Using env variables
   * const sql = new SqlDataSource();
   * await sql.connect();
   * ```
   */
  constructor(input?: SqlDataSourceInput<D, T, C>) {
    super(input as SqlDataSourceInput);
    this.sqlType = (input?.type || this.type) as D;

    // Cast input to access connection properties that come from mapped types
    const inputAny = input as Record<string, any> | undefined;

    // Create inputDetails by merging input with base class values (from env vars)
    // This ensures connection details are available even if only partially provided
    this.inputDetails = {
      ...input,
      type: this.sqlType,
      host: inputAny?.host ?? this.host,
      port: inputAny?.port ?? this.port,
      username: inputAny?.username ?? this.username,
      password: inputAny?.password ?? this.password,
      database: inputAny?.database ?? this.database,
      logs: inputAny?.logs ?? this.logs,
    } as unknown as SqlDataSourceInput<D, T, C>;

    // Set connection policies with defaults
    this.inputDetails.connectionPolicies = input?.connectionPolicies || {
      retry: {
        maxRetries: 0,
        delay: 0,
      },
    };

    // Set query format options with defaults
    this.inputDetails.queryFormatOptions = input?.queryFormatOptions || {
      language: getSqlDialect(this.sqlType),
      keywordCase: "lower",
      dataTypeCase: "lower",
      functionCase: "lower",
    };

    // Set cache configuration
    this.cacheKeys = (input?.cacheStrategy?.keys ?? {}) as C;
    this.cacheAdapter = input?.cacheStrategy?.cacheAdapter ?? this.cacheAdapter;

    // Set AdminJS options
    this.adminJsOptions = input?.adminJs;

    // Set migrations path
    this.migrationsPath = input?.migrationsPath || this.migrationsPath;

    // Set models configured on the sql data source instance
    this._models = (input?.models || {}) as T;

    // Set slaves configured on the sql data source instance
    this.slaves = (input?.replication?.slaves || []).map(
      (slave) => new SqlDataSource(slave as SqlDataSourceInput<D, T, C>),
    );

    // Set slave algorithm
    this.slaveAlgorithm = input?.replication?.slaveAlgorithm || "roundRobin";

    // Set slave failure callback
    this.onSlaveServerFailure = input?.replication?.onSlaveServerFailure;
  }

  // ============================================
  // Connect Method
  // ============================================

  /**
   * @description Establishes the database connection and sets this instance as the primary connection, it also connects to the slaves if any are configured
   * @throws {HysteriaError} If the connection is already established, use `SqlDataSource.useConnection` or `SqlDataSource.connectToSecondarySource` for auxiliary connections
   * @example
   * ```ts
   * const sql = new SqlDataSource({ type: "mysql", ... });
   * await sql.connect();
   * ```
   */
  async connect(): Promise<void> {
    if (SqlDataSource.#instance) {
      throw new HysteriaError(
        "SqlDataSource::connect",
        "CONNECTION_ALREADY_ESTABLISHED",
      );
    }

    // Create the connection pool
    this.sqlPool = await createSqlPool(this.sqlType, this.inputDetails);
    this.ownsPool = true;

    // Connect to the slaves if any are configured
    if (this.slaves.length) {
      await Promise.all(
        this.slaves.map(async (slave) => {
          slave.sqlPool = await createSqlPool(
            slave.sqlType,
            slave.inputDetails,
          );
          slave.ownsPool = true;
        }),
      );
    }

    // Set as primary instance
    SqlDataSource.#instance = this;
  }

  // ============================================
  // Instance Methods
  // ============================================

  /**
   * @description Returns true if the connection is established
   */
  get isConnected(): boolean {
    return !!this.sqlPool || !!this.sqlConnection;
  }

  /**
   * @description Returns true if this instance is in a global transaction
   */
  get isInGlobalTransaction(): boolean {
    return !!this.globalTransaction;
  }

  /**
   * @description Returns the models configured on this SqlDataSource instance
   */
  get models(): T {
    return this._models;
  }

  /**
   * @description Selects a slave from the pool using the configured algorithm
   * @returns A slave SqlDataSource instance or null if no slaves are available
   */
  getSlave(): SqlDataSource<D, T, C> | null {
    if (!this.slaves.length) {
      return null;
    }

    if (this.slaveAlgorithm === "random") {
      return this.slaves[Math.floor(Math.random() * this.slaves.length)];
    }

    const slave = this.slaves[this.roundRobinIndex % this.slaves.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % this.slaves.length;
    return slave;
  }

  /**
   * @description Uses the cache adapter to get a value from the cache
   * @param key The key to get the value from
   * @param args The arguments to pass to the key handler
   */
  async useCache<K extends keyof C>(
    key: K,
    ...args: Parameters<C[K]>
  ): Promise<UseCacheReturnType<C, K>>;
  /**
   * @description Uses the cache adapter to get a value from the cache
   * @param key The key to get the value from
   * @param ttl The time to live for the value in milliseconds
   * @param args The arguments to pass to the key handler
   */
  async useCache<K extends keyof C>(
    key: K,
    ttl: number,
    ...args: Parameters<C[K]>
  ): Promise<UseCacheReturnType<C, K>>;
  async useCache<K extends keyof C>(
    key: K,
    ttlOrFirstArg?: number | any,
    ...restArgs: any[]
  ): Promise<UseCacheReturnType<C, K>> {
    if (!this.cacheAdapter) {
      throw new HysteriaError(
        "SqlDataSource::useCache",
        "CACHE_ADAPTER_NOT_CONFIGURED",
      );
    }

    const mappedKeyHandler = this.cacheKeys[key];
    if (!mappedKeyHandler) {
      throw new HysteriaError(
        "SqlDataSource::useCache",
        `KEY_${key as string}_HAS_NO_HANDLER_IN_CACHE_KEYS_CONFIG`,
      );
    }

    const handlerArgsCount = (mappedKeyHandler as Function).length;
    const isTTLProvided =
      typeof ttlOrFirstArg === "number" && handlerArgsCount === restArgs.length;

    let ttl: number | undefined;
    let args: any[] = [];

    if (isTTLProvided) {
      ttl = ttlOrFirstArg;
      args = restArgs;
    } else {
      ttl = undefined;
      args =
        ttlOrFirstArg !== undefined ? [ttlOrFirstArg, ...restArgs] : restArgs;
    }

    const hashedArgs = hashString(JSON.stringify(args));
    const cachedKey = hashedArgs
      ? `${key as string}:${hashedArgs}`
      : (key as string);

    const cachedValue = await this.cacheAdapter.get<unknown>(cachedKey);
    if (cachedValue !== undefined) {
      return cachedValue as UseCacheReturnType<C, K>;
    }

    const retrievedValue = await (mappedKeyHandler as Function)(...args);
    await this.cacheAdapter.set(cachedKey, retrievedValue, ttl);
    return retrievedValue;
  }

  /**
   * @description Invalidates a value from the cache
   * @param key The key to invalidate the value from
   * @param args The arguments to pass to the key handler (required if the handler expects arguments)
   */
  async invalidCache<K extends keyof C>(
    key: K,
    ...args: Parameters<C[K]>
  ): Promise<void>;
  async invalidCache<K extends keyof C>(key: K): Promise<void>;
  async invalidCache<K extends keyof C>(key: K, ...args: any[]): Promise<void> {
    if (!this.cacheAdapter) {
      throw new HysteriaError(
        "SqlDataSource::invalidCache",
        "CACHE_ADAPTER_NOT_CONFIGURED",
      );
    }

    const mappedKeyHandler = this.cacheKeys[key];
    if (!mappedKeyHandler) {
      throw new HysteriaError(
        "SqlDataSource::invalidCache",
        `KEY_${key as string}_HAS_NO_HANDLER_IN_CACHE_KEYS_CONFIG`,
      );
    }

    const handlerArgsCount = (mappedKeyHandler as Function).length;

    if (handlerArgsCount > 0 && args.length === 0) {
      const cachedKey = key as string;
      await this.cacheAdapter.invalidate(cachedKey);
      return;
    }

    const hashedArgs = hashString(JSON.stringify(args));
    const cachedKey = hashedArgs
      ? `${key as string}:${hashedArgs}`
      : (key as string);

    await this.cacheAdapter.invalidate(cachedKey);
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
      cloned.sqlPool = await createSqlPool(
        cloned.sqlType,
        this.inputDetails as SqlDataSourceInput<SqlDataSourceType>,
      );
      cloned.ownsPool = true;
    } else {
      cloned.sqlPool = this.sqlPool;
      cloned.ownsPool = false;
    }

    return cloned;
  }

  /**
   * @description Returns the type of the database
   */
  getDbType(): D {
    return this.sqlType;
  }

  /**
   * @description Returns a QueryBuilder instance for raw queries
   * @description Query builder from the SqlDataSource instance returns raw data from the database
   * @param table The table name to query from
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
   * @description Returns a DryQueryBuilder instance that returns the query statement without executing
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
   * @description Starts a global transaction on the database
   * @description Intended for testing purposes - wraps all operations in a transaction that can be rolled back
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
   * @description Commits a global transaction on the database
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
   * @description Rolls back a global transaction on the database
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
   * @description Starts a transaction on a dedicated connection from the pool
   * @param cb if a callback is provided, it will execute the callback and commit or rollback the transaction based on the callback's success or failure
   * @param options.isolationLevel The isolation level to use for the transaction
   * @sqlite ignores the isolation level
   */
  async startTransaction(
    options?: StartTransactionOptions,
  ): Promise<Transaction>;
  async startTransaction(
    cb: (trx: Transaction) => Promise<void>,
    options?: StartTransactionOptions,
  ): Promise<void>;
  async startTransaction<TOption extends TransactionOptionsOrCallback>(
    optionsOrCb?:
      | StartTransactionOptions
      | ((trx: Transaction) => Promise<void>),
    maybeOptions?: StartTransactionOptions,
  ): Promise<StartTransactionReturnType<TOption>> {
    const options =
      typeof optionsOrCb === "function" ? maybeOptions : optionsOrCb;

    // If a global transaction is active, create a nested transaction on the same connection
    if (this.globalTransaction?.isActive) {
      if (typeof optionsOrCb === "function") {
        try {
          await this.globalTransaction.nestedTransaction(optionsOrCb);
          return undefined as StartTransactionReturnType<TOption>;
        } catch (error) {
          throw error;
        }
      }

      const nested = await this.globalTransaction.nestedTransaction();
      return nested as StartTransactionReturnType<TOption>;
    }

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
        return undefined as StartTransactionReturnType<TOption>;
      } catch (error) {
        await sqlTrx.rollback({
          throwErrorOnInactiveTransaction: false,
        });
        throw error;
      }
    }

    return sqlTrx as StartTransactionReturnType<TOption>;
  }

  /**
   * @alias startTransaction
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
    return this.startTransaction(
      optionsOrCb as (trx: Transaction) => Promise<void>,
      maybeOptions,
    );
  }

  /**
   * @description Returns a ModelManager instance for the given model
   */
  getModelManager<M extends Model>(
    model: { new (): M } | typeof Model,
  ): ModelManager<M> {
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
   * @description Returns the current raw driver Pool
   * @throws {HysteriaError} If the connection pool is not established
   */
  getPool(): getPoolReturnType<D> {
    if (!this.sqlPool) {
      throw new HysteriaError(
        "SqlDataSource::getPool",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return this.sqlPool as getPoolReturnType<D>;
  }

  /**
   * @description Returns a connection from the pool
   * @throws {HysteriaError} If the connection is not established
   */
  async getConnection(): Promise<GetConnectionReturnType<D>> {
    if (this.sqlConnection) {
      return this.sqlConnection as GetConnectionReturnType<D>;
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
        return (await mysqlPool.getConnection()) as GetConnectionReturnType<D>;
      case "postgres":
      case "cockroachdb":
        const pgPool = this.sqlPool as PgPoolClientInstance;
        return (await pgPool.connect()) as GetConnectionReturnType<D>;
      case "sqlite":
        return this.sqlPool as GetConnectionReturnType<D>;
      case "mssql":
        const mssqlPool = this.sqlPool as MssqlPoolInstance;
        return mssqlPool.transaction() as GetConnectionReturnType<D>;
      case "oracledb":
        const oracledbPool = this.sqlPool as OracleDBPoolInstance;
        return (await oracledbPool.getConnection()) as GetConnectionReturnType<D>;
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
   * @description Also disconnects all slave connections if any are configured
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

    await this.cacheAdapter?.disconnect?.();

    if (this.slaves.length) {
      await Promise.all(
        this.slaves.map(async (slave) => {
          try {
            await slave.closeConnection();
          } catch (err: any) {
            logger.warn(
              `SqlDataSource::closeConnection - Error while closing slave connection: ${err.message}`,
            );
          }
        }),
      );
    }

    log("Closing connection", this.logs);
    switch (this.sqlType) {
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
      case "mssql":
        await (this.sqlPool as MssqlPoolInstance).close();
        break;
      case "oracledb":
        await (this.sqlPool as OracleDBPoolInstance).close();
        break;
      default:
        throw new HysteriaError(
          "SqlDataSource::closeConnection",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }

    this.sqlPool = null;
    this.sqlConnection = null;
  }

  /**
   * @description Returns the connection details
   */
  getConnectionDetails(): SqlDataSourceInput<D, T, C> {
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
    } as unknown as SqlDataSourceInput<D, T, C>;
  }

  /**
   * @alias closeConnection
   */
  async disconnect(): Promise<void> {
    return this.closeConnection();
  }

  /**
   * @description Syncs the schema of the database with the models metadata
   * @warning This will drop and recreate all the indexes and constraints, use with caution
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
   * @description Executes a raw query on the database and returns the raw driver result
   */
  async rawQuery<R = RawQueryResponseType<D>>(
    query: string,
    params: any[] = [],
    options?: RawQueryOptions,
  ): Promise<R> {
    if (!this.isConnected) {
      throw new HysteriaError(
        "SqlDataSource::rawQuery",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    const formattedQuery = formatQuery(this, query);
    const replicationMode = options?.replicationMode || "master";

    if (replicationMode === "slave") {
      return this.executeOnSlave(async (slaveInstance) => {
        return execSql(
          formattedQuery,
          params,
          slaveInstance,
          this.getDbType(),
          "raw",
        ) as R;
      });
    }

    return execSql(formattedQuery, params, this, this.getDbType(), "raw") as R;
  }

  /**
   * @description Adds a raw statement to an operation like where or update
   * @example
   * ```ts
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
      Object.values(this._models) as unknown as (new () => Model)[],
    );
  }

  // AdminJS Methods

  /**
   * @description Initializes AdminJS with the configured options
   * @throws {HysteriaError} If AdminJS is not enabled in the configuration
   */
  async initializeAdminJs(): Promise<AdminJsAdminInstance> {
    if (!this.adminJsOptions?.enabled) {
      throw new HysteriaError(
        "SqlDataSource::initializeAdminJs",
        "ADMINJS_NOT_ENABLED",
      );
    }

    if (this.adminJsInstance) {
      return this.adminJsInstance.admin;
    }

    this.adminJsInstance = await initializeAdminJs(this, this.adminJsOptions);
    return this.adminJsInstance?.admin as AdminJsAdminInstance;
  }

  /**
   * @description Initializes AdminJS with Express router
   * @throws {HysteriaError} If AdminJS is not enabled in the configuration
   */
  async initializeAdminJsExpress(): Promise<Required<AdminJsInstance>> {
    if (!this.adminJsOptions?.enabled) {
      throw new HysteriaError(
        "SqlDataSource::initializeAdminJsExpress",
        "ADMINJS_NOT_ENABLED",
      );
    }

    if (this.adminJsInstance?.router) {
      return this.adminJsInstance as Required<AdminJsInstance>;
    }

    this.adminJsInstance = await initializeAdminJsExpress(
      this,
      this.adminJsOptions,
    );
    return this.adminJsInstance as Required<AdminJsInstance>;
  }

  /**
   * @description Returns the AdminJS instance if initialized
   */
  getAdminJs(): AdminJsInstance | undefined {
    return this.adminJsInstance;
  }

  /**
   * @description Returns the AdminJS configuration options
   */
  getAdminJsOptions(): AdminJsOptions | undefined {
    return this.adminJsOptions;
  }

  /**
   * @description Checks if AdminJS is enabled
   */
  isAdminJsEnabled(): boolean {
    return !!this.adminJsOptions?.enabled;
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
   * @description Introspects table indexes metadata
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

    // sqlite
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

  /**
   * @description Introspects table foreign keys metadata
   */
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

  // ============================================
  // Private Methods
  // ============================================

  /**
   * @description Executes an operation on a slave, handling failures with the configured callback
   * @param operation The operation to execute on the slave
   * @returns The result of the operation, or falls back to master if slave fails
   */
  private async executeOnSlave<R>(
    operation: (slave: SqlDataSource<D, T, C>) => Promise<R>,
  ): Promise<R> {
    const slave = this.getSlave();

    if (!slave) {
      return operation(this);
    }

    try {
      return await operation(slave);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (this.onSlaveServerFailure) {
        await this.onSlaveServerFailure(err, {
          host: slave.host,
          port: slave.port,
          username: slave.username,
          password: slave.password,
          database: slave.database,
          type: slave.sqlType,
        });

        return operation(this);
      }

      throw err;
    }
  }

  /**
   * @description Internal method to establish connection without setting as primary instance
   * @description Used by connectToSecondarySource and useConnection
   */
  private async connectWithoutSettingPrimary(): Promise<void> {
    this.sqlPool = await createSqlPool(this.sqlType, this.inputDetails);
    this.ownsPool = true;
  }
}
