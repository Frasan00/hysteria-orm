import crypto from "node:crypto";
import { HysteriaError } from "../../errors/hysteria_error";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../resources/query/TRANSACTION";
import { SqlDataSource } from "../sql_data_source";
import {
  TransactionExecutionOptions,
  TransactionIsolationLevel,
} from "./transaction_types";
import logger from "../../utils/logger";

/**
 * @description Transaction class, not meant to be used directly, use SqlDataSource.startTransaction() instead
 */
export class Transaction {
  sqlDataSource: SqlDataSource;
  isActive: boolean;
  transactionId: string;
  isolationLevel?: TransactionIsolationLevel;

  constructor(
    sqlDataSource: SqlDataSource,
    isolationLevel?: TransactionIsolationLevel,
  ) {
    this.sqlDataSource = sqlDataSource;
    this.isActive = false;
    this.transactionId = crypto.randomUUID();
    this.isolationLevel = isolationLevel;
  }

  async startTransaction(): Promise<void> {
    const isolationQuery = this.getIsolationLevelQuery();

    if (!isolationQuery) {
      await this.sqlDataSource.rawQuery(BEGIN_TRANSACTION);
      this.isActive = true;
      return;
    }

    if (
      this.sqlDataSource.type === "mysql" ||
      this.sqlDataSource.type === "mariadb"
    ) {
      await this.sqlDataSource.rawQuery(isolationQuery);
      await this.sqlDataSource.rawQuery(BEGIN_TRANSACTION);
      this.isActive = true;
      return;
    }

    await this.sqlDataSource.rawQuery(`${BEGIN_TRANSACTION} ${isolationQuery}`);
    this.isActive = true;
  }

  /**
   * @description Commit the transaction
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
      await this.sqlDataSource.rawQuery(COMMIT_TRANSACTION);
    } finally {
      await this.releaseConnection();
      this.isActive = false;
    }
  }

  /**
   * @description Rollback the transaction
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
      await this.sqlDataSource.rawQuery(ROLLBACK_TRANSACTION);
    } finally {
      await this.releaseConnection();
      this.isActive = false;
    }
  }

  async releaseConnection(): Promise<void> {
    switch (this.sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        await this.sqlDataSource.getCurrentDriverConnection("mysql").end();
        break;
      case "postgres":
      case "cockroachdb":
        await this.sqlDataSource.getCurrentDriverConnection("postgres").end();
        break;
      case "sqlite":
        await this.sqlDataSource.getCurrentDriverConnection("sqlite").close();
        break;
      default:
        throw new HysteriaError(
          "TRANSACTION::releaseConnection",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlDataSource.type}`,
        );
    }
  }

  private getIsolationLevelQuery(): string {
    if (!this.isolationLevel) {
      return "";
    }

    if (
      this.sqlDataSource.type === "sqlite" &&
      this.isolationLevel !== "SERIALIZABLE"
    ) {
      throw new HysteriaError(
        "TRANSACTION::getIsolationLevelQuery",
        "SQLITE_ONLY_SUPPORTS_SERIALIZABLE_ISOLATION_LEVEL",
      );
    }

    if (
      this.sqlDataSource.type === "mysql" ||
      this.sqlDataSource.type === "mariadb"
    ) {
      return `SET TRANSACTION ISOLATION LEVEL ${this.isolationLevel}`;
    }

    if (
      this.sqlDataSource.type === "postgres" ||
      this.sqlDataSource.type === "cockroachdb"
    ) {
      return `ISOLATION LEVEL ${this.isolationLevel}`;
    }

    if (this.sqlDataSource.type === "sqlite") {
      return "";
    }

    throw new HysteriaError(
      "TRANSACTION::getIsolationLevelQuery",
      `UNSUPPORTED_DATABASE_TYPE_${this.sqlDataSource.type}`,
    );
  }
}
