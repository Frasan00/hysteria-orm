import { HysteriaError } from "../../errors/hysteria_error";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../resources/query/TRANSACTION";
import { SqlDataSource } from "../sql_data_source";

export class Transaction {
  sqlDataSource: SqlDataSource;
  isActive: boolean;

  constructor(sqlDataSource: SqlDataSource) {
    this.sqlDataSource = sqlDataSource;
    this.isActive = false;
  }

  async startTransaction(): Promise<void> {
    await this.sqlDataSource.rawQuery(BEGIN_TRANSACTION);
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
}
