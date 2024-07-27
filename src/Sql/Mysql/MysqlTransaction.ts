import { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { BEGIN_TRANSACTION } from "../Templates/Query/TRANSACTION";
import { COMMIT_TRANSACTION } from "../Templates/Query/TRANSACTION";
import { ROLLBACK_TRANSACTION } from "../Templates/Query/TRANSACTION";
import { log, queryError } from "../../Logger";
import { Metadata, Model } from "../Models/Model";
import selectTemplate from "../Templates/Query/SELECT";
import { parseDatabaseDataIntoModelResponse } from "../serializer";

export class MysqlTransaction {
  protected tableName: string;
  protected mysql: Pool;
  protected mysqlConnection!: PoolConnection;
  protected logs: boolean;

  constructor(mysql: Pool, tableName: string, logs: boolean) {
    this.logs = logs;
    this.mysql = mysql;
    this.tableName = tableName;
  }

  public async queryInsert<T extends Model>(
    query: string,
    params: any[],
    metadata: Metadata,
  ): Promise<T> {
    if (!this.mysqlConnection) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    const [rows]: any = await this.mysqlConnection.query<RowDataPacket[]>(
      query,
      params,
    );
    const insertId = rows.insertId;
    const select = selectTemplate(this.tableName, "mysql").selectById(insertId);
    const [savedModel] =
      await this.mysqlConnection.query<RowDataPacket[]>(select);
    Object.assign(savedModel[0], { metadata });
    return savedModel[0] as T;
  }

  public async massiveInsertQuery<T extends Model>(
    query: string,
    params: any[],
  ): Promise<T[]> {
    if (!this.mysql) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const [rows]: any = await this.mysqlConnection.query<RowDataPacket[]>(
        query,
        params,
      );

      return rows.map(
        (row: T) => parseDatabaseDataIntoModelResponse([row]) as T,
      );
    } catch (error) {
      queryError(error);
      throw new Error(
        "Failed to execute massive insert query in transaction " + error,
      );
    }
  }

  public async queryUpdate<T extends Model>(
    query: string,
    params?: any[],
  ): Promise<number> {
    if (!this.mysqlConnection) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    const [rows]: any = await this.mysqlConnection.query<RowDataPacket[]>(
      query,
      params,
    );
    return rows.affectedRows;
  }

  public async queryDelete(query: string, params?: any[]): Promise<number> {
    if (!this.mysqlConnection) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    const [rows]: any = await this.mysqlConnection.query<RowDataPacket[]>(
      query,
      params,
    );

    return rows.affectedRows;
  }

  /**
   * Start transaction.
   */
  async start(): Promise<void> {
    try {
      log(BEGIN_TRANSACTION, this.logs);
      this.mysqlConnection = await this.mysql.getConnection();
      await this.mysqlConnection.query(BEGIN_TRANSACTION);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to start transaction " + error);
    }
  }

  /**
   * Commit transaction.
   */
  async commit(): Promise<void> {
    if (!this.mysqlConnection) {
      throw new Error("MysqlTransaction not started.");
    }

    try {
      log(COMMIT_TRANSACTION, this.logs);
      await this.mysqlConnection.query(COMMIT_TRANSACTION);
      this.mysqlConnection.release();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to commit transaction " + error);
    }
  }

  /**
   * Rollback transaction.
   */
  async rollback(): Promise<void> {
    if (!this.mysqlConnection) {
      return;
    }

    try {
      log(ROLLBACK_TRANSACTION, this.logs);
      await this.mysqlConnection.query(ROLLBACK_TRANSACTION);
      this.mysqlConnection.release();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to rollback transaction " + error);
    }
  }
}
