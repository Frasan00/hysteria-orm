import { Connection, RowDataPacket } from "mysql2/promise";
import { BEGIN_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { COMMIT_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { ROLLBACK_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { log, queryError } from "../../Logger";
import { Model } from "../Models/Model";
import selectTemplate from "../Resources/Query/SELECT";
import { parseDatabaseDataIntoModelResponse } from "../serializer";

export class MysqlTransaction {
  protected mysql: Connection;
  protected logs: boolean;
  protected isTransactionStarted: boolean = false;
  protected mysqlType: "mysql" | "mariadb";

  constructor(
    mysql: Connection,
    logs: boolean,
    mysqlType: "mysql" | "mariadb",
  ) {
    this.logs = logs;
    this.mysql = mysql;
    this.mysqlType = mysqlType;
  }

  public async queryInsert<T extends Model>(
    query: string,
    params: any[],
    typeofModel: typeof Model,
  ): Promise<T> {
    if (!this.isTransactionStarted) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    const [rows]: any = await this.mysql.query<RowDataPacket[]>(query, params);
    const insertId = rows.insertId;
    const select = selectTemplate("mysql", typeofModel).selectById(insertId);
    const [savedModel] = await this.mysql.query<RowDataPacket[]>(
      select,
      insertId,
    );
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
      const [rows]: any = await this.mysql.query<RowDataPacket[]>(
        query,
        params,
      );

      const idsToFetchList = Array.from(
        { length: rows.affectedRows },
        (_, i) => i + rows.insertId,
      );

      const select = selectTemplate("mysql", typeofModel).selectByIds(
        idsToFetchList,
      );

      const [savedModels] = await this.mysql.query<RowDataPacket[]>(select);
      const results = savedModels as T[];
      const serializedModel = (await parseDatabaseDataIntoModelResponse(
        results,
        typeofModel,
      )) as T[];

      return typeofModel.afterFetch
        ? ((await typeofModel.afterFetch(serializedModel)) as T[])
        : serializedModel;
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
  ): Promise<number> {
    if (!this.mysql) {
      throw new Error("MysqlTransaction not started.");
    }
    try {
      log(query, this.logs, params);
      const rows: any = await this.mysql.query(query, params);
      if (!rows[0]) {
        return 0;
      }

      return rows[0].affectedRows;
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
  ): Promise<number> {
    if (!this.mysql) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    try {
      const [rows]: any = await this.mysql.query(query, params);
      if (!rows[0].affectedRows) {
        return 0;
      }

      return rows.affectedRows;
    } catch (error) {
      queryError(error);
      throw new Error(
        "Failed to execute massive insert query in transaction " + error,
      );
    }
  }

  public async queryUpdate(query: string, params?: any[]): Promise<number> {
    if (!this.isTransactionStarted) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    const [rows]: any = await this.mysql.query<RowDataPacket[]>(query, params);
    return rows.affectedRows;
  }

  public async queryDelete(query: string, params?: any[]): Promise<number> {
    if (!this.isTransactionStarted) {
      throw new Error("MysqlTransaction not started.");
    }

    log(query, this.logs, params);
    const [rows]: any = await this.mysql.query<RowDataPacket[]>(query, params);

    return rows.affectedRows;
  }

  /**
   * Start transaction.
   */
  async start(): Promise<void> {
    try {
      log(BEGIN_TRANSACTION, this.logs);
      await this.mysql.beginTransaction();
      this.isTransactionStarted = true;
    } catch (error) {
      queryError(error);
      throw new Error("Failed to start transaction " + error);
    }
  }

  /**
   * Commit transaction.
   */
  async commit(): Promise<void> {
    if (!this.isTransactionStarted) {
      throw new Error("MysqlTransaction not started.");
    }

    try {
      log(COMMIT_TRANSACTION, this.logs);
      await this.mysql.commit();
      this.mysql.destroy();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to commit transaction " + error);
    }
  }

  /**
   * Rollback transaction.
   */
  async rollback(): Promise<void> {
    if (!this.mysql) {
      return;
    }

    try {
      log(ROLLBACK_TRANSACTION, this.logs);
      await this.mysql.rollback();
      this.mysql.destroy();
    } catch (error) {
      queryError(error);
      this.mysql.destroy();
      throw new Error("Failed to rollback transaction " + error);
    }
  }
}
