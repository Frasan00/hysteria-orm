import { Connection } from "mysql2/promise";
import { SqlConnectionType, SqlDataSource } from "./SqlDatasource";
import { log } from "../Logger";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "./Resources/Query/TRANSACTION";
import { Client } from "pg";
import { Database } from "sqlite3";

export class Transaction {
  public sqlDataSource: SqlDataSource;
  public sqlConnection: SqlConnectionType;
  private logs: boolean;

  constructor(sqlDataSource: SqlDataSource, logs: boolean = false) {
    this.sqlDataSource = sqlDataSource;
    this.sqlConnection = this.sqlDataSource.getCurrentConnection();
    this.logs = logs;
  }

  public async startTransaction(): Promise<void> {
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
    } catch (error) {
      await this.releaseConnection();
    }
  }

  public async commit(): Promise<void> {
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
    } catch (error) {
      throw error;
    } finally {
      await this.releaseConnection();
    }
  }

  public async rollback(): Promise<void> {
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
