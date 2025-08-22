import { Mutex } from "async-mutex";
import crypto from "node:crypto";
import { HysteriaError } from "../../errors/hysteria_error";
import logger from "../../utils/logger";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../ast/transaction";
import { SqlDataSource } from "../sql_data_source";
import {
  TransactionExecutionOptions,
  TransactionIsolationLevel,
} from "./transaction_types";

/**
 * @description Transaction class, not meant to be used directly, use sql.startTransaction() instead
 */
export class Transaction {
  sql: SqlDataSource;
  isActive: boolean;
  transactionId: string;
  isolationLevel?: TransactionIsolationLevel;
  private _connectionReleased = false;
  private _mutex = new Mutex();

  constructor(sql: SqlDataSource, isolationLevel?: TransactionIsolationLevel) {
    this.sql = sql;
    this.isActive = false;
    this.transactionId = crypto.randomUUID();
    this.isolationLevel = isolationLevel;
  }

  async startTransaction(): Promise<void> {
    const isolationQuery = this.getIsolationLevelQuery();
    try {
      if (!isolationQuery) {
        await this.sql.rawQuery(BEGIN_TRANSACTION);
        this.isActive = true;
        return;
      }
      if (this.sql.type === "mysql" || this.sql.type === "mariadb") {
        await this.sql.rawQuery(isolationQuery);
        await this.sql.rawQuery(BEGIN_TRANSACTION);
        this.isActive = true;
        return;
      }
      await this.sql.rawQuery(`${BEGIN_TRANSACTION} ${isolationQuery}`);
      this.isActive = true;
    } catch (error: any) {
      this.isActive = false;
      logger.error(error);
      throw error;
    }
  }

  /**
   * @description Commit the transaction
   * @throws {HysteriaError} if the transaction is not active and options.throwErrorOnInactiveTransaction is true
   * @logs if the transaction is not active and options.throwErrorOnInactiveTransaction is false
   */
  async commit(options?: TransactionExecutionOptions): Promise<void> {
    return this._mutex.runExclusive(async () => {
      const endConnection = options?.endConnection ?? true;
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
        await this.sql.rawQuery(COMMIT_TRANSACTION);
      } catch (error: any) {
        logger.error(error);
        throw error;
      } finally {
        if (endConnection) {
          await this.releaseConnection();
        }
        this.isActive = false;
      }
    });
  }

  /**
   * @description Rollback the transaction
   * @throws {HysteriaError} if the transaction is not active and options.throwErrorOnInactiveTransaction is true
   * @logs if the transaction is not active and options.throwErrorOnInactiveTransaction is false
   */
  async rollback(options?: TransactionExecutionOptions): Promise<void> {
    return this._mutex.runExclusive(async () => {
      const endConnection = options?.endConnection ?? true;
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
        await this.sql.rawQuery(ROLLBACK_TRANSACTION);
      } catch (error: any) {
        logger.error(error);
        throw error;
      } finally {
        if (endConnection) {
          await this.releaseConnection();
        }
        this.isActive = false;
      }
    });
  }

  /**
   * @description Release the connection, does nothing if the connection is already released
   */
  async releaseConnection(): Promise<void> {
    if (this._connectionReleased) return;
    this._connectionReleased = true;
    try {
      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
          await this.sql.getCurrentDriverConnection("mysql").end();
          break;
        case "postgres":
        case "cockroachdb":
          await this.sql.getCurrentDriverConnection("postgres").end();
          break;
        case "sqlite":
          await new Promise<void>((resolve, reject) => {
            this.sql.getCurrentDriverConnection("sqlite").close((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
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
      return `ISOLATION LEVEL ${this.isolationLevel}`;
    }

    if (this.sql.type === "sqlite") {
      return "";
    }

    throw new HysteriaError(
      "TRANSACTION::getIsolationLevelQuery",
      `UNSUPPORTED_DATABASE_TYPE_${this.sql.type}`,
    );
  }
}
