import crypto from "node:crypto";
import { HysteriaError } from "../../errors/hysteria_error";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../resources/query/TRANSACTION";
import { SqlDataSource } from "../sql_data_source";
import { TransactionIsolationLevel } from "./transaction_types";

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

  async commit(): Promise<void> {
    if (!this.isActive) {
      throw new HysteriaError("TRANSACTION::commit", "TRANSACTION_NOT_ACTIVE");
    }

    try {
      await this.sqlDataSource.rawQuery(COMMIT_TRANSACTION);
    } finally {
      await this.releaseConnection();
      this.isActive = false;
    }
  }

  async rollback(): Promise<void> {
    if (!this.isActive) {
      throw new HysteriaError(
        "TRANSACTION::rollback",
        "TRANSACTION_NOT_ACTIVE",
      );
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
