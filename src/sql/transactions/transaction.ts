// Transaction class does not use the ast parser nor nodes since it's not used in any query builder and the transaction only lives here

import crypto from "node:crypto";
import { HysteriaError } from "../../errors/hysteria_error";
import logger from "../../utils/logger";
import { SqlDataSource } from "../sql_data_source";
import {
  GetConnectionReturnType,
  SqlDataSourceWithoutTransaction,
} from "../sql_data_source_types";
import {
  NestedTransactionCallback,
  NestedTransactionReturnType,
  TransactionExecutionOptions,
  TransactionIsolationLevel,
} from "./transaction_types";

/**
 * @description Transaction class, not meant to be used directly, use sql.startTransaction() instead
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
   * const trx = await sql.startTransaction();
   * await trx.rawQuery("SELECT * FROM users");
   *
   * // Model manager
   * const modelManager = trx.sql.getModelManager(User);
   * await modelManager.insert({ name: "John Doe" });
   *
   * // Query builder
   * await trx.query(User.table).insert({ name: "John Doe" });
   *
   * await trx.commit();
   * ```
   */
  sql: SqlDataSourceWithoutTransaction;
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
    this.transactionId = crypto.randomBytes(16).toString("hex");
    this.isolationLevel = isolationLevel;
    this.isNested = isNested;
    this.nestingDepth = nestingDepth;
  }

  /**
   * @description Creates a new transaction with the same isolation level and same connection using save points
   * @description If a callback is provided, it will execute the callback and commit or rollback the nested transaction save points based on the callback's success or failure
   */
  async nestedTransaction(): Promise<Transaction>;
  async nestedTransaction(
    cb: (trx: Transaction) => Promise<void>,
  ): Promise<void>;
  async nestedTransaction<T extends NestedTransactionCallback | undefined>(
    cb?: T,
  ): Promise<NestedTransactionReturnType<T>> {
    const trx = new Transaction(
      this.sql as SqlDataSource,
      this.isolationLevel,
      true,
      this.nestingDepth + 1,
    );

    await trx.startTransaction();

    if (cb) {
      try {
        await cb(trx);
        await trx.commit();
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    }

    return trx as NestedTransactionReturnType<T>;
  }

  /**
   * @description Starts a transaction, automatically handled from the sql data source instance in the `startTransaction` method
   */
  async startTransaction(): Promise<void> {
    const levelQuery = this.getIsolationLevelQuery();
    // Nested transactions use SAVEPOINTs and do not begin a new transaction
    if (this.isNested) {
      const savepoint = this.getSavePointName();
      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
        case "postgres":
        case "cockroachdb":
          await this.sql.rawQuery(`SAVEPOINT ${savepoint}`);
          this.isActive = true;
          return;
        case "sqlite":
          await this.sql.rawQuery(`SAVEPOINT ${savepoint}`);
          this.isActive = true;
          return;
      }
    }

    // Top-level transaction handling
    switch (this.sql.type) {
      case "mysql":
      case "mariadb":
        if (levelQuery) {
          await this.sql.rawQuery(levelQuery);
        }

        const mysqlConnection = this.sql
          .sqlConnection as GetConnectionReturnType<"mysql">;
        await mysqlConnection.beginTransaction();

        this.isActive = true;
        break;
      case "postgres":
      case "cockroachdb":
        await this.sql.rawQuery("BEGIN TRANSACTION");
        if (levelQuery) {
          await this.sql.rawQuery(levelQuery);
        }

        this.isActive = true;
        break;
      case "sqlite":
        if (levelQuery) {
          await this.sql.rawQuery(levelQuery);
        }

        await this.sql.rawQuery("BEGIN TRANSACTION");
        this.isActive = true;
        break;
    }
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

    try {
      // Nested transactions should release their savepoint and keep the outer transaction/connection
      if (this.isNested) {
        const savepoint = this.getSavePointName();
        switch (this.sql.type) {
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

      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
          const mysqlConnection = this.sql
            .sqlConnection as GetConnectionReturnType<"mysql">;
          await mysqlConnection.commit();
          break;
        case "postgres":
        case "cockroachdb":
          await this.sql.rawQuery("COMMIT");
          break;
        case "sqlite":
          await this.sql.rawQuery("COMMIT");
          break;
      }
    } catch (error: any) {
      logger.error(error);
      throw error;
    }

    await this.releaseConnection();
    this.isActive = false;
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

    try {
      // Nested transactions should rollback to their savepoint and keep the outer transaction/connection
      if (this.isNested) {
        const savepoint = this.getSavePointName();
        switch (this.sql.type) {
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

      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
          const mysqlConnection = this.sql
            .sqlConnection as GetConnectionReturnType<"mysql">;
          await mysqlConnection.rollback();
          break;
        case "postgres":
        case "cockroachdb":
          await this.sql.rawQuery("ROLLBACK");
          break;
        case "sqlite":
          await this.sql.rawQuery("ROLLBACK");
          break;
        default:
          throw new HysteriaError(
            "TRANSACTION::rollback",
            `UNSUPPORTED_DATABASE_TYPE_${this.sql.type}`,
          );
      }
    } catch (error: any) {
      logger.error(error);
      throw error;
    }

    await this.releaseConnection();
    this.isActive = false;
  }

  /**
   * @description Release the connection, does nothing if the connection is already released
   */
  private async releaseConnection(): Promise<void> {
    if (this.connectionReleased) {
      return;
    }

    try {
      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
          (
            this.sql.sqlConnection as GetConnectionReturnType<"mysql">
          ).release();
          break;
        case "postgres":
        case "cockroachdb":
          (
            this.sql.sqlConnection as GetConnectionReturnType<"postgres">
          ).release();
          break;
        case "sqlite":
          // Since we are living on a single connection, we don't need to release sqlite
          break;
        default:
          throw new HysteriaError(
            "TRANSACTION::releaseConnection",
            `UNSUPPORTED_DATABASE_TYPE_${this.sql.type}`,
          );
      }
    } catch (error: any) {
      logger.error(error);
    }

    await this.sql.closeConnection();
    this.sql.sqlConnection = null;
    this.connectionReleased = true;
  }

  private getIsolationLevelQuery(): string {
    if (!this.isolationLevel) {
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
