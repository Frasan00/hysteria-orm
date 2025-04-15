import { DataSource } from "../data_source/data_source";
import { HysteriaError } from "../errors/hysteria_error";
import { CaseConvention } from "../utils/case_utils";
import logger from "../utils/logger";
import { Model } from "./models/model";
import { ModelManager } from "./models/model_manager/model_manager";
import { QueryBuilder } from "./query_builder/query_builder";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "./resources/query/TRANSACTION";
import { createSqlConnection } from "./sql_connection_utils";
import type {
  ConnectionPolicies,
  GetCurrentConnectionReturnType,
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlConnectionType,
  SqlDataSourceInput,
  SqlDataSourceType,
  SqlDriverSpecificOptions,
  SqliteConnectionInstance,
  UseConnectionInput,
} from "./sql_data_source_types";
import { execSql } from "./sql_runner/sql_runner";
import { Transaction } from "./transactions/transaction";

export class SqlDataSource extends DataSource {
  declare private sqlConnection: SqlConnectionType;
  private static instance: SqlDataSource | null = null;
  private sqlType: SqlDataSourceType;
  private inGlobalTransaction: boolean = false;
  /**
   * @description The retry policy for the database connection
   */
  retryPolicy: ConnectionPolicies["retry"];

  // Static Methods
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

    await sqlDataSource.rawQuery("SELECT 1");
    SqlDataSource.instance = sqlDataSource;
    await cb?.(sqlDataSource);
    return sqlDataSource;
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
   * @description Column names are converted to the case convention specified in the options when interacting with the database but won't be converted when serializing or parsing the data
   * @description Use Models to have type safety and serialization
   */
  static query(
    table: string,
    options?: {
      databaseCaseConvention?: CaseConvention;
    },
  ): QueryBuilder {
    return new QueryBuilder(
      {
        modelCaseConvention: "camel",
        databaseCaseConvention: options?.databaseCaseConvention || "snake",
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
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<void> {
    return this.getInstance().useTransaction(cb, driverSpecificOptions);
  }

  /**
   * @description Starts a global transaction on the database
   */
  static async startGlobalTransaction(): Promise<void> {
    await this.getInstance().rawQuery(BEGIN_TRANSACTION);
  }

  /**
   * @description Commits a global transaction on the database
   */
  static async commitGlobalTransaction(): Promise<void> {
    await this.getInstance().rawQuery(COMMIT_TRANSACTION);
  }

  /**
   * @description Rolls back a global transaction on the database
   */
  static async rollbackGlobalTransaction(): Promise<void> {
    await this.getInstance().rawQuery(ROLLBACK_TRANSACTION);
  }

  /**
   * @description Starts a transaction on the database and returns a Transaction instance
   */
  static async startTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(driverSpecificOptions);
  }

  /**
   * @alias startTransaction
   */
  static async beginTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(driverSpecificOptions);
  }

  /**
   * @alias startTransaction
   */
  static async transaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(driverSpecificOptions);
  }

  /**
   * @description Creates a new SqlDataSource instance with a custom connection and executes a callback with the new instance
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
    await customSqlInstance.rawQuery("SELECT 1");
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
      maxRetries: 3,
      delay: 1000,
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
   * @description Column names are converted to the case convention specified in the options when interacting with the database but won't be converted when serializing or parsing the data
   * @description Use Models to have type safety and serialization
   */
  query(
    table: string,
    options?: {
      databaseCaseConvention?: CaseConvention;
    },
  ): QueryBuilder {
    return new QueryBuilder(
      {
        modelCaseConvention: "camel",
        databaseCaseConvention: options?.databaseCaseConvention || "snake",
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
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<void> {
    const trx = await this.startTransaction(driverSpecificOptions);
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
  async startGlobalTransaction(): Promise<void> {
    if (this.inGlobalTransaction) {
      throw new HysteriaError(
        "SqlDataSource::startGlobalTransaction",
        "GLOBAL_TRANSACTION_ALREADY_STARTED",
      );
    }

    await this.rawQuery(BEGIN_TRANSACTION);
    this.inGlobalTransaction = true;
  }

  /**
   * @description Commits a global transaction on the database on the main connection
   */
  async commitGlobalTransaction(): Promise<void> {
    if (!this.inGlobalTransaction) {
      throw new HysteriaError(
        "SqlDataSource::commitGlobalTransaction",
        "GLOBAL_TRANSACTION_NOT_STARTED",
      );
    }
    await this.rawQuery(COMMIT_TRANSACTION);
    this.inGlobalTransaction = false;
  }

  /**
   * @description Rolls back a global transaction on the database on the main connection
   */
  async rollbackGlobalTransaction(): Promise<void> {
    if (!this.inGlobalTransaction) {
      throw new HysteriaError(
        "SqlDataSource::rollbackGlobalTransaction",
        "GLOBAL_TRANSACTION_NOT_STARTED",
      );
    }

    await this.rawQuery(ROLLBACK_TRANSACTION);
    this.inGlobalTransaction = false;
  }

  /**
   * @description Starts a transaction on the database and returns a Transaction instance
   */
  async startTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    const sqlDataSource = new SqlDataSource({
      type: this.sqlType,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      ...driverSpecificOptions,
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
        ...driverSpecificOptions,
      },
    );

    const sqlTrx = new Transaction(sqlDataSource);
    await sqlTrx.startTransaction();
    return sqlTrx;
  }

  /**
   * @alias startTransaction
   */
  async beginTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.startTransaction(driverSpecificOptions);
  }

  /**
   * @alias startTransaction
   */
  async transaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.startTransaction(driverSpecificOptions);
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
}
