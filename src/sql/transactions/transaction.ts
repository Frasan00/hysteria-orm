import { Connection } from "mysql2/promise";
import { SqlDataSource } from "../sql_data_source";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../resources/query/TRANSACTION";
import { Client } from "pg";
import { Database } from "sqlite3";
import { log } from "../../utils/logger";
import { SqlConnectionType } from "../sql_data_source_types";

export class Transaction {
  sqlDataSource: SqlDataSource;
  sqlConnection: SqlConnectionType;
  isActive: boolean;
  private readonly logs: boolean;

  constructor(sqlDataSource: SqlDataSource, logs?: boolean) {
    this.sqlDataSource = sqlDataSource;
    this.sqlConnection = this.sqlDataSource.getCurrentConnection();
    this.isActive = false;
    this.logs = logs || this.sqlDataSource.logs || false;
  }

  async startTransaction(): Promise<void> {
    try {
      switch (this.sqlDataSource.getDbType()) {
        case "mysql":
        case "mariadb":
          log(BEGIN_TRANSACTION, this.logs);
          await (this.sqlConnection as Connection).beginTransaction();
          break;

        case "postgres":
          log(BEGIN_TRANSACTION, this.logs);
          await (this.sqlConnection as Client).query(BEGIN_TRANSACTION);
          break;

        case "sqlite":
          log(BEGIN_TRANSACTION, this.logs);
          (this.sqlConnection as Database).run(BEGIN_TRANSACTION, (err) => {
            if (err) {
              throw new Error(err.message);
            }
          });
          break;

        default:
          throw new Error("Invalid database type while beginning transaction");
      }

      this.isActive = true;
    } catch (error) {
      await this.releaseConnection();
    }
  }

  async commit(): Promise<void> {
    try {
      switch (this.sqlDataSource.getDbType()) {
        case "mysql":
        case "mariadb":
          log(COMMIT_TRANSACTION, this.logs);
          await (this.sqlConnection as Connection).commit();
          break;

        case "postgres":
          log(COMMIT_TRANSACTION, this.logs);
          await (this.sqlConnection as Client).query(COMMIT_TRANSACTION);
          break;

        case "sqlite":
          log(COMMIT_TRANSACTION, this.logs);
          (this.sqlConnection as Database).run(COMMIT_TRANSACTION, (err) => {
            if (err) {
              throw new Error(err.message);
            }
          });
          break;
        default:
          throw new Error("Invalid database type while committing transaction");
      }

      this.isActive = false;
    } catch (error) {
      throw error;
    } finally {
      await this.releaseConnection();
    }
  }

  async rollback(): Promise<void> {
    try {
      switch (this.sqlDataSource.getDbType()) {
        case "mysql":
        case "mariadb":
          log(ROLLBACK_TRANSACTION, this.logs);
          await (this.sqlConnection as Connection).rollback();
          break;

        case "postgres":
          log(ROLLBACK_TRANSACTION, this.logs);
          await (this.sqlConnection as Client).query(ROLLBACK_TRANSACTION);
          break;

        case "sqlite":
          log(ROLLBACK_TRANSACTION, this.logs);
          (this.sqlConnection as Database).run(ROLLBACK_TRANSACTION, (err) => {
            if (err) {
              throw new Error(err.message);
            }
          });
          break;

        default:
          throw new Error(
            "Invalid database type while rolling back transaction",
          );
      }

      this.isActive = false;
    } finally {
      await this.releaseConnection();
    }
  }

  private async releaseConnection(): Promise<void> {
    switch (this.sqlDataSource.getDbType()) {
      case "mysql":
      case "mariadb":
        await (this.sqlConnection as Connection).end();
        break;

      case "postgres":
        await (this.sqlConnection as Client).end();
        break;

      case "sqlite":
        (this.sqlConnection as Database).close();
        break;

      default:
        throw new Error("Invalid database type while releasing connection");
    }
  }
}
