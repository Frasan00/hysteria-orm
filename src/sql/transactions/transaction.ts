import crypto from "node:crypto";
import { HysteriaError } from "../../errors/hysteria_error";
import logger from "../../utils/logger";
import { SqlDataSource } from "../sql_data_source";
import { GetConnectionReturnType } from "../sql_data_source_types";
import { execSql } from "../sql_runner/sql_runner";
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
  private sqlConnection: GetConnectionReturnType;
  private connectionReleased = false;

  constructor(
    sql: SqlDataSource,
    sqlConnection: GetConnectionReturnType,
    isolationLevel?: TransactionIsolationLevel,
  ) {
    this.sql = sql;
    this.isActive = false;
    this.transactionId = crypto.randomUUID();
    this.isolationLevel = isolationLevel;
    this.sqlConnection = sqlConnection;
  }

  async startTransaction(): Promise<void> {
    this.sql = this.sql.clone();
    this.sql.sqlPool = this.sqlConnection as any;
    const levelQuery = this.getIsolationLevelQuery();
    switch (this.sql.type) {
      case "mysql":
      case "mariadb":
        if (levelQuery) {
          await execSql(levelQuery, [], this.sql, "raw", {
            customConnection: this.sqlConnection,
          });
        }

        const mysqlConnection = this
          .sqlConnection as GetConnectionReturnType<"mysql">;
        try {
          await mysqlConnection.beginTransaction();
        } catch (err) {
          // Global transactions use the pool connection, so we can't use the beginTransaction method and fallback to raw query
          await execSql("START TRANSACTION", [], this.sql, "raw", {
            customConnection: this.sqlConnection,
          });
        }

        this.isActive = true;
        break;
      case "postgres":
      case "cockroachdb":
        if (levelQuery) {
          await execSql(levelQuery, [], this.sql, "raw", {
            customConnection: this.sqlConnection,
          });
        }

        await execSql("BEGIN TRANSACTION", [], this.sql, "raw", {
          customConnection: this.sqlConnection,
        });
        this.isActive = true;
        break;
      case "sqlite":
        if (levelQuery) {
          await execSql(levelQuery, [], this.sql, "raw", {
            customConnection: this.sqlConnection,
          });
        }

        await execSql("BEGIN TRANSACTION", [], this.sql, "raw", {
          customConnection: this.sqlConnection,
        });

        this.isActive = true;
        break;
    }
  }

  /**
   * @description Commit the transaction
   * @throws {HysteriaError} if the transaction is not active and options.throwErrorOnInactiveTransaction is true
   * @logs if the transaction is not active and options.throwErrorOnInactiveTransaction is false
   */
  async commit(options?: TransactionExecutionOptions): Promise<void> {
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
      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
          const mysqlConnection = this
            .sqlConnection as GetConnectionReturnType<"mysql">;

          try {
            await mysqlConnection.commit();
          } catch (err) {
            // Global transactions use the pool connection, so we can't use the commit method and fallback to raw query
            await execSql("COMMIT", [], this.sql, "raw", {
              customConnection: this.sqlConnection,
            });
          }
          break;
        case "postgres":
        case "cockroachdb":
          await execSql("COMMIT", [], this.sql, "raw", {
            customConnection: this.sqlConnection,
          });
          break;
        case "sqlite":
          await execSql("COMMIT", [], this.sql, "raw", {
            customConnection: this.sqlConnection,
          });
          break;
      }
    } catch (error: any) {
      logger.error(error);
      throw error;
    } finally {
      if (endConnection) {
        await this.releaseConnection();
      }
      this.isActive = false;
    }
  }

  /**
   * @description Rollback the transaction
   * @throws {HysteriaError} if the transaction is not active and options.throwErrorOnInactiveTransaction is true
   * @logs if the transaction is not active and options.throwErrorOnInactiveTransaction is false
   */
  async rollback(options?: TransactionExecutionOptions): Promise<void> {
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
      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
          const mysqlConnection = this
            .sqlConnection as GetConnectionReturnType<"mysql">;
          try {
            await mysqlConnection.rollback();
          } catch (err) {
            // Global transactions use the pool connection, so we can't use the rollback method and fallback to raw query
            await execSql("ROLLBACK", [], this.sql, "raw", {
              customConnection: this.sqlConnection,
            });
          }
          break;
        case "postgres":
        case "cockroachdb":
          await execSql("ROLLBACK", [], this.sql, "raw", {
            customConnection: this.sqlConnection,
          });
          break;
        case "sqlite":
          await execSql("ROLLBACK", [], this.sql, "raw", {
            customConnection: this.sqlConnection,
          });
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
    } finally {
      if (endConnection) {
        await this.releaseConnection();
      }
      this.isActive = false;
    }
  }

  /**
   * @description Release the connection, does nothing if the connection is already released
   */
  async releaseConnection(): Promise<void> {
    if (this.connectionReleased) return;
    this.connectionReleased = true;
    try {
      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
          (this.sqlConnection as GetConnectionReturnType<"mysql">).release();
          break;
        case "postgres":
        case "cockroachdb":
          (this.sqlConnection as GetConnectionReturnType<"postgres">).release();
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
}
