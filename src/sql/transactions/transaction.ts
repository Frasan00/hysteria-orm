// Transaction class does not use the ast parser nor nodes since it's not used in any query builder and the transaction only lives here

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
  /**
   * @description The sql data source instance that the transaction is running on
   */
  sql: SqlDataSource;
  /**
   * @description Whether the transaction is active
   */
  isActive: boolean;
  /**
   * @description The transaction unique identifier
   */
  transactionId: string;

  private isolationLevel?: TransactionIsolationLevel;
  private connectionReleased = false;

  constructor(sql: SqlDataSource, isolationLevel?: TransactionIsolationLevel) {
    this.sql = sql;
    this.isActive = false;
    this.transactionId = crypto.randomBytes(16).toString("hex");
    this.isolationLevel = isolationLevel;
  }

  async startTransaction(): Promise<void> {
    const levelQuery = this.getIsolationLevelQuery();
    switch (this.sql.type) {
      case "mysql":
      case "mariadb":
        if (levelQuery) {
          await execSql(levelQuery, [], this.sql, "raw");
        }

        const mysqlConnection = this.sql
          .sqlConnection as GetConnectionReturnType<"mysql">;
        await mysqlConnection.beginTransaction();

        this.isActive = true;
        break;
      case "postgres":
      case "cockroachdb":
        await execSql("BEGIN TRANSACTION", [], this.sql, "raw");
        if (levelQuery) {
          await execSql(levelQuery, [], this.sql, "raw");
        }

        this.isActive = true;
        break;
      case "sqlite":
        if (levelQuery) {
          await execSql(levelQuery, [], this.sql, "raw");
        }

        await execSql("BEGIN TRANSACTION", [], this.sql, "raw");
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
      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
          const mysqlConnection = this.sql
            .sqlConnection as GetConnectionReturnType<"mysql">;
          await mysqlConnection.commit();
          break;
        case "postgres":
        case "cockroachdb":
          await execSql("COMMIT", [], this.sql, "raw");
          break;
        case "sqlite":
          await execSql("COMMIT", [], this.sql, "raw");
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
      switch (this.sql.type) {
        case "mysql":
        case "mariadb":
          const mysqlConnection = this.sql
            .sqlConnection as GetConnectionReturnType<"mysql">;
          await mysqlConnection.rollback();
          break;
        case "postgres":
        case "cockroachdb":
          await execSql("ROLLBACK", [], this.sql, "raw");
          break;
        case "sqlite":
          await execSql("ROLLBACK", [], this.sql, "raw");
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
}
