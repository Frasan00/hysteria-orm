// Transaction class does not use the ast parser nor nodes since it's not used in any query builder and the transaction only lives here

import { bytesToHex, loadPlatform } from "../../platform/platform_adapter";
import { HysteriaError } from "../../errors/hysteria_error";
import logger, { log } from "../../utils/logger";
import { SqlDataSource } from "../sql_data_source";
import { GetConnectionReturnType } from "../sql_data_source_types";
import {
  TransactionExecutionOptions,
  TransactionIsolationLevel,
} from "./transaction_types";
import { TransactionContext } from "./transaction_context";

/**
 * @description Transaction class, not meant to be used directly, use sql.transaction() instead
 */
export class Transaction {
  /**
   * @description The sql data source instance that the transaction is running on here you can both query or execute raw queries
   * @example
   * ```ts
   * import { sql } from "hysteria-orm";
   * import { User } from "./models/user";
   *
   * // Raw queries
   * const trx = await sql.transaction();
   * await trx.rawQuery("SELECT * FROM users");
   *
   * // Model manager
   * const modelManager = trx.sql.getModelManager(User);
   * await modelManager.insert({ name: "John Doe" });
   *
   * // Query builder with model
   * await trx.sql.from(User).insert({ name: "John Doe" });
   *
   * // Query builder with table name
   * await trx.sql.from("users").insert({ name: "John Doe" });
   *
   * await trx.commit();
   * ```
   */
  sql: Omit<SqlDataSource, "transaction" | "startGlobalTransaction">;
  /**
   * @description Whether the transaction is active
   */
  isActive: boolean;
  /**
   * @description The transaction unique identifier
   */
  transactionId: string;

  private connectionReleased = false;
  private isolationLevel?: TransactionIsolationLevel;
  private isNested: boolean;
  private nestingDepth: number;

  constructor(
    sql: SqlDataSource,
    isolationLevel?: TransactionIsolationLevel,
    isNested = false,
    nestingDepth = 0,
  ) {
    this.sql = sql;
    this.isActive = false;
    this.transactionId = bytesToHex(loadPlatform().crypto.randomBytes(16));
    this.isolationLevel = isolationLevel;
    this.isNested = isNested;
    this.nestingDepth = nestingDepth;
  }

  /**
   * @description Creates a new transaction with the same isolation level and same connection using save points
   * @description If a callback is provided, it will execute the callback and commit or rollback the nested transaction save points based on the callback's success or failure
   */
  async nestedTransaction(): Promise<Transaction>;
  async nestedTransaction<T>(cb: (trx: Transaction) => Promise<T>): Promise<T>;
  async nestedTransaction<T>(
    cb?: (trx: Transaction) => Promise<T>,
  ): Promise<Transaction | T> {
    const trx = new Transaction(
      this.sql as SqlDataSource,
      this.isolationLevel,
      true,
      this.nestingDepth + 1,
    );

    await trx.transaction();

    if (cb) {
      try {
        const result = await TransactionContext.run(trx, () => cb(trx));
        await trx.commit();
        return result;
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    }

    return trx;
  }

  /**
   * @description Starts a transaction, automatically handled from the sql data source instance in the `transaction` method
   */
  async transaction(): Promise<void> {
    this.getIsolationLevelQuery(); // validates the isolation level (sqlite accepts SERIALIZABLE only)
    // Nested transactions use SAVEPOINTs and do not begin a new transaction
    if (this.isNested) {
      const savepoint = this.getSavePointName();
      if (this.sql.type === "mssql") {
        await this.sql.rawQuery(`SAVE TRANSACTION ${savepoint}`);
      } else {
        await this.sql.rawQuery(`SAVEPOINT ${savepoint}`);
      }
      this.isActive = true;
      return;
    }

    // Top-level transaction handling
    if (
      this.sql.type === "mssql" ||
      this.sql.type === "mysql" ||
      this.sql.type === "mariadb"
    ) {
      log("BEGIN TRANSACTION", this.sql.logs);
    }
    const adapter = (this.sql as SqlDataSource).driverAdapter;
    const connection = this.sql.sqlConnection;
    if (!adapter || !connection) {
      throw new HysteriaError(
        "TRANSACTION::transaction",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }
    await adapter.beginTransaction(connection, {
      isolationLevel: this.isolationLevel,
      rawQuery: (query, params) => this.sql.rawQuery(query, params ?? []),
    });
    this.isActive = true;
  }

  /**
   * @description Commit the transaction releasing the connection
   * @throws {HysteriaError} if the transaction is not active and options.throwErrorOnInactiveTransaction is true
   * @logs if the transaction is not active and options.throwErrorOnInactiveTransaction is false
   */
  async commit(options?: TransactionExecutionOptions): Promise<void> {
    if (!this.isActive) {
      if (options?.throwErrorOnInactiveTransaction) {
        throw new HysteriaError(
          "TRANSACTION::commit",
          "TRANSACTION_NOT_ACTIVE",
        );
      }
      logger.warn("Transaction::commit - TRANSACTION_NOT_ACTIVE");
      return;
    }

    // Nested transactions should release their savepoint and keep the outer transaction/connection
    if (this.isNested) {
      const savepoint = this.getSavePointName();
      switch (this.sql.type) {
        case "mssql":
          // MSSQL doesn't support RELEASE SAVEPOINT - savepoints are automatically released on commit
          break;
        case "mysql":
        case "mariadb":
        case "postgres":
        case "cockroachdb":
        case "sqlite":
          await this.sql.rawQuery(`RELEASE SAVEPOINT ${savepoint}`);
          break;
      }
      this.isActive = false;
      return;
    }

    try {
      const adapter = (this.sql as SqlDataSource).driverAdapter;
      const connection = this.sql.sqlConnection;
      if (
        this.sql.type === "mssql" ||
        this.sql.type === "mysql" ||
        this.sql.type === "mariadb"
      ) {
        log("COMMIT", this.sql.logs);
      }
      if (adapter && connection) {
        await adapter.commitTransaction(connection, {
          rawQuery: (query, params) => this.sql.rawQuery(query, params ?? []),
        });
      }
    } catch (error: any) {
      logger.error(error);
      throw error;
    } finally {
      await this.releaseConnection();
      this.isActive = false;
    }
  }

  /**
   * @description Rollback the transaction releasing the connection
   * @throws {HysteriaError} if the transaction is not active and options.throwErrorOnInactiveTransaction is true
   * @logs if the transaction is not active and options.throwErrorOnInactiveTransaction is false
   */
  async rollback(options?: TransactionExecutionOptions): Promise<void> {
    if (!this.isActive) {
      if (options?.throwErrorOnInactiveTransaction) {
        throw new HysteriaError(
          "TRANSACTION::rollback",
          "TRANSACTION_NOT_ACTIVE",
        );
      }

      logger.warn("Transaction::rollback - TRANSACTION_NOT_ACTIVE");
      return;
    }

    // Nested transactions should rollback to their savepoint and keep the outer transaction/connection
    if (this.isNested) {
      const savepoint = this.getSavePointName();
      switch (this.sql.type) {
        case "mssql":
          await this.sql.rawQuery(`ROLLBACK TRANSACTION ${savepoint}`);
          break;
        case "mysql":
        case "mariadb":
        case "postgres":
        case "cockroachdb":
          await this.sql.rawQuery(`ROLLBACK TO SAVEPOINT ${savepoint}`);
          break;
        case "sqlite":
          await this.sql.rawQuery(`ROLLBACK TO ${savepoint}`);
          break;
        default:
          throw new HysteriaError(
            "TRANSACTION::rollback",
            `UNSUPPORTED_DATABASE_TYPE_${this.sql.type}`,
          );
      }
      this.isActive = false;
      return;
    }

    try {
      const adapter = (this.sql as SqlDataSource).driverAdapter;
      const connection = this.sql.sqlConnection;
      if (
        this.sql.type === "mssql" ||
        this.sql.type === "mysql" ||
        this.sql.type === "mariadb"
      ) {
        log("ROLLBACK", this.sql.logs);
      }
      if (adapter && connection) {
        await adapter.rollbackTransaction(connection, {
          rawQuery: (query, params) => this.sql.rawQuery(query, params ?? []),
        });
      }
    } catch (error: any) {
      logger.error(error);
      throw error;
    } finally {
      await this.releaseConnection();
      this.isActive = false;
    }
  }

  /**
   * @description Release the connection, does nothing if the connection is already released
   */
  private async releaseConnection(): Promise<void> {
    if (this.connectionReleased) {
      return;
    }

    let releaseError: any = null;
    try {
      (this.sql as SqlDataSource).driverAdapter?.releaseConnection(
        this.sql.sqlConnection as GetConnectionReturnType<never>,
      );
    } catch (error: any) {
      releaseError = error;
      logger.error(error);
    }

    // Null before disconnect() - it re-releases sqlConnection if still set, double-releasing
    // the pool client (harmless on postgres, but a real steal-another-caller's-client risk
    // under a saturated pool).
    this.sql.sqlConnection = null;

    try {
      await this.sql.disconnect();
    } catch (err: any) {
      logger.warn(
        `Transaction::releaseConnection - disconnect failed: ${err?.message ?? err}`,
      );
    }

    this.connectionReleased = true;

    if (releaseError) {
      throw releaseError;
    }
  }

  private getIsolationLevelQuery(): string {
    // MSSQL is handled in the getMssqlTransactionLevel method
    if (!this.isolationLevel || this.sql.type === "mssql") {
      return "";
    }

    if (this.sql.type === "sqlite" && this.isolationLevel !== "SERIALIZABLE") {
      throw new HysteriaError(
        "TRANSACTION::getIsolationLevelQuery",
        "SQLITE_ONLY_SUPPORTS_SERIALIZABLE_ISOLATION_LEVEL",
      );
    }

    if (this.sql.type === "mysql" || this.sql.type === "mariadb") {
      return `SET TRANSACTION ISOLATION LEVEL ${this.isolationLevel}`;
    }

    if (this.sql.type === "postgres" || this.sql.type === "cockroachdb") {
      return `SET TRANSACTION ISOLATION LEVEL ${this.isolationLevel}`;
    }

    if (this.sql.type === "sqlite") {
      return "";
    }

    throw new HysteriaError(
      "TRANSACTION::getIsolationLevelQuery",
      `UNSUPPORTED_DATABASE_TYPE_${this.sql.type}`,
    );
  }

  private getSavePointName(): string {
    const shortId = this.transactionId.slice(0, 8).toUpperCase();
    return `sp_${this.nestingDepth}_${shortId}`;
  }
}
