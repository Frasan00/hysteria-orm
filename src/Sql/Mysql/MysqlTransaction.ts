import { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { BEGIN_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { COMMIT_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { ROLLBACK_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { log, queryError } from "../../Logger";
import { Model } from "../Models/Model";
import selectTemplate from "../Resources/Query/SELECT";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import mysql from "mysql2/promise";

export class MysqlTransaction {
  protected mysql: Pool;
  protected mysqlPool!: PoolConnection;
  protected logs: boolean;
  protected mysqlType: "mysql" | "mariadb";

  constructor(mysql: Pool, logs: boolean, mysqlType: "mysql" | "mariadb") {
    this.logs = logs;
    this.mysql = mysql;
    this.mysqlType = mysqlType;
  }

  public async queryInsert<T extends Model>(
    query: string,
    params: any[],
    typeofModel: typeof Model,
  ): Promise<T> {
    if (!this.mysqlPool) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    const [rows]: any = await this.mysqlPool.query<RowDataPacket[]>(
      query,
      params,
    );

    if (this.mysqlType === "mariadb") {
      return (await parseDatabaseDataIntoModelResponse(
        [rows[0] as T],
        typeofModel,
      )) as T;
    }

    const insertId = rows.insertId;
    const select = selectTemplate("mysql", typeofModel).selectById(insertId);
    const [savedModel] = await this.mysqlPool.query<RowDataPacket[]>(select);
    const result = savedModel[0] as T;
    return (await parseDatabaseDataIntoModelResponse(
      [result],
      typeofModel,
    )) as T;
  }

  public async massiveInsertQuery<T extends Model>(
    query: string,
    params: any[],
    typeofModel: typeof Model,
  ): Promise<T[]> {
    if (!this.mysql) {
      throw new Error("MysqlTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const [rows]: any = await this.mysqlPool.query<RowDataPacket[]>(
        query,
        params,
      );

      if (this.mysqlType === "mariadb") {
        return (await parseDatabaseDataIntoModelResponse(
          rows,
          typeofModel,
        )) as T[];
      }

      // FIXME: should check the insertIds
      return (await parseDatabaseDataIntoModelResponse(
        rows as T[],
        typeofModel,
      )) as T[];
    } catch (error) {
      queryError(error);
      throw new Error(
        "Failed to execute massive insert query in transaction " + error,
      );
    }
  }

  public async massiveUpdateQuery<T extends Model>(
    query: string,
    params: any[],
    selectQueryDetails: {
      typeofModel: typeof Model;
      modelIds: (string | number)[];
      primaryKey: string;
      table: string;
      joinClause: string;
    },
  ): Promise<T[]> {
    if (!this.mysql) {
      throw new Error("MysqlTransaction not started.");
    }

    const { typeofModel, modelIds, table, joinClause, primaryKey } =
      selectQueryDetails;
    try {
      log(query, this.logs, params);
      const rows: any = await this.mysql.query(query, params);
      if (!rows.length) {
        return [];
      }

      const afterUpdateDataQuery = modelIds.length
        ? `SELECT * FROM ${table} ${joinClause} WHERE ${primaryKey} IN (${Array(
            modelIds.length,
          )
            .fill("?")
            .join(",")}) `
        : `SELECT * FROM ${table}`;

      const updatedData = await this.mysql.query<mysql.RowDataPacket[]>(
        afterUpdateDataQuery,
        modelIds,
      );

      const data = await (parseDatabaseDataIntoModelResponse(
        updatedData[0] as T[],
        typeofModel,
      ) as Promise<T[]>);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      queryError(error);
      throw new Error(
        "Failed to execute massive insert query in transaction " + error,
      );
    }
  }

  public async massiveDeleteQuery<T extends Model>(
    query: string,
    params: any[],
    models: T[],
    typeofModel: typeof Model,
  ): Promise<T[]> {
    if (!this.mysql) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    try {
      const rows: any = await this.mysql.query(query, params);
      if (!rows.length) {
        throw new Error("Failed to update");
      }

      const data = await (parseDatabaseDataIntoModelResponse(
        models as T[],
        typeofModel,
      ) as Promise<T[]>);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      queryError(error);
      throw new Error(
        "Failed to execute massive insert query in transaction " + error,
      );
    }
  }

  public async queryUpdate(query: string, params?: any[]): Promise<number> {
    if (!this.mysqlPool) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    const [rows]: any = await this.mysqlPool.query<RowDataPacket[]>(
      query,
      params,
    );
    return rows.affectedRows;
  }

  public async queryDelete(query: string, params?: any[]): Promise<number> {
    if (!this.mysqlPool) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    const [rows]: any = await this.mysqlPool.query<RowDataPacket[]>(
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
      this.mysqlPool = await this.mysql.getConnection();
      await this.mysqlPool.query(BEGIN_TRANSACTION);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to start transaction " + error);
    }
  }

  /**
   * Commit transaction.
   */
  async commit(): Promise<void> {
    if (!this.mysqlPool) {
      throw new Error("MysqlTransaction not started.");
    }

    try {
      log(COMMIT_TRANSACTION, this.logs);
      await this.mysqlPool.query(COMMIT_TRANSACTION);
      this.mysqlPool.release();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to commit transaction " + error);
    }
  }

  /**
   * Rollback transaction.
   */
  async rollback(): Promise<void> {
    if (!this.mysqlPool) {
      return;
    }

    try {
      log(ROLLBACK_TRANSACTION, this.logs);
      await this.mysqlPool.query(ROLLBACK_TRANSACTION);
      this.mysqlPool.release();
    } catch (error) {
      queryError(error);
      this.mysqlPool.release();
      throw new Error("Failed to rollback transaction " + error);
    }
  }
}
