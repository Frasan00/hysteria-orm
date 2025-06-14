import { FormatOptionsWithLanguage } from "sql-formatter";
import { DataSource } from "../data_source/data_source";
import { HysteriaError } from "../errors/hysteria_error";
import logger from "../utils/logger";
import { Model } from "./models/model";
import { ModelManager } from "./models/model_manager/model_manager";
import { QueryBuilder } from "./query_builder/query_builder";
import { createSqlConnection } from "./sql_connection_utils";
import type {
  ConnectionPolicies,
  GetCurrentConnectionReturnType,
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlConnectionType,
  SqlDataSourceInput,
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

export class SqlDataSource extends DataSource {
  declare private sqlConnection: SqlConnectionType;
  private static instance: SqlDataSource | null = null;
  private globalTransaction: Transaction | null = null;
  private sqlType: SqlDataSourceType;

  /**
   * @description The retry policy for the database connection
   */
  retryPolicy: ConnectionPolicies["retry"];
  queryFormatOptions: FormatOptionsWithLanguage;

  // Static Methods

  /**
   * @description Establishes the default connection used by default by all the Models, if not configuration is passed, env variables will be used instead
   * @description You can continue to use the global sql class exported by hysteria after the connectionwithout having to rely on the return of this function
   * @example
   * ```ts
   * import { sql } from "hysteria-orm";
   * const connection = await sql.connect();
   * // You can use both connection and sql from now own, since `sql` will use the default connection after being connected
   * connection.query();
   * sql.query();
   * ```
   */
  static async connect(
    input: SqlDataSourceInput,
    cb?: (sqlDataSource: SqlDataSource) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connect(
    cb?: (sqlDataSource: SqlDataSource) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connect(
    inputOrCb?:
      | SqlDataSourceInput
      | ((sqlDataSource: SqlDataSource) => Promise<void> | void),
    cb?: (sqlDataSource: SqlDataSource) => Promise<void> | void,
  ): Promise<SqlDataSource> {
    if (typeof inputOrCb === "function") {
      cb = inputOrCb;
      inputOrCb = undefined;
    }

    const sqlDataSource = new this(inputOrCb as SqlDataSourceInput);
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
    await cb?.(sqlDataSource);
    return sqlDataSource;
  }

  /**
   * @description Get's another database connection and return it, this won't be marked as the default connection used by the Models, for that use the static method `connect`
   */
  static async connectToSecondarySource(
    input: SqlDataSourceInput,
    cb?: (sqlDataSource: SqlDataSource) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connectToSecondarySource(
    cb?: (sqlDataSource: SqlDataSource) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connectToSecondarySource(
    inputOrCb?:
      | SqlDataSourceInput
      | ((sqlDataSource: SqlDataSource) => Promise<void> | void),
    cb?: (sqlDataSource: SqlDataSource) => Promise<void> | void,
  ): Promise<SqlDataSource> {
    if (typeof inputOrCb === "function") {
      cb = inputOrCb;
      inputOrCb = undefined;
    }

    const sqlDataSource = new this(inputOrCb as SqlDataSourceInput);
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
    await cb?.(sqlDataSource);
    return sqlDataSource;
  }

  /**
   * @description Creates a new connection and executes a callback with the new instance, the connection is automatically closed after the callback is executed, so it's lifespan is only inside the callback
   */
  static async useConnection(
    connectionDetails: UseConnectionInput,
    cb: (sqlDataSource: SqlDataSource) => Promise<void>,
  ): Promise<void> {
    const customSqlInstance = new SqlDataSource(connectionDetails);
    customSqlInstance.sqlConnection = await createSqlConnection(
      customSqlInstance.sqlType,
      {
        ...connectionDetails,
      },
    );
    await customSqlInstance.testConnectionQuery("SELECT 1");
    try {
      await cb(customSqlInstance).then(async () => {
        if (!customSqlInstance.isConnected) {
          return;
        }

        await customSqlInstance.closeConnection();
      });
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
        modelCaseConvention: "none",
        databaseCaseConvention: "none",
        table: table,
      } as typeof Model,
      this.getInstance(),
    );
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
   * @description Closes the current connection
   */
  static async closeConnection(): Promise<void> {
    if (!SqlDataSource.instance) {
      logger.warn("Connection already closed");
      return;
    }

    return SqlDataSource.getInstance().closeConnection();
  }

  /**
   * @alias closeConnection
   */
  static async disconnect(): Promise<void> {
    return SqlDataSource.closeConnection();
  }

  /**
   * @description Executes a raw query on the database
   */
  static async rawQuery<T = any>(
    query: string,
    params: any[] = [],
  ): Promise<T> {
    return SqlDataSource.getInstance().rawQuery(query, params);
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
        modelCaseConvention: "none",
        databaseCaseConvention: "none",
        table: table,
      } as typeof Model,
      this,
    );
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
        SqlDataSource.instance = null;
        break;
      case "postgres":
      case "cockroachdb":
        (this.sqlConnection as PgPoolClientInstance).end();
        SqlDataSource.instance = null;
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
        SqlDataSource.instance = null;
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

  private async testConnectionQuery(query: string): Promise<void> {
    await execSql(query, [], this, "raw", {
      shouldNotLog: true,
    });
  }

  static get isInGlobalTransaction(): boolean {
    return !!this.instance?.globalTransaction;
  }

  get isInGlobalTransaction(): boolean {
    return !!this.globalTransaction;
  }
}
