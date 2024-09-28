import { QueryResult, Client } from "pg";
import { BEGIN_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { COMMIT_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { ROLLBACK_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { log, queryError } from "../../Logger";
import { Model } from "../Models/Model";
import selectTemplate from "../Resources/Query/SELECT";
import { parseDatabaseDataIntoModelResponse } from "../serializer";

export class PostgresTransaction {
  protected pgClient: Client;
  protected isTransactionStarted: boolean = false;
  protected logs: boolean;

  constructor(pgClient: Client, logs: boolean) {
    this.logs = logs;
    this.pgClient = pgClient;
  }

  public async queryInsert<T extends Model>(
    query: string,
    params: any[],
    typeofModel: typeof Model,
  ): Promise<T> {
    if (!this.isTransactionStarted) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rows }: QueryResult<T> = await this.pgClient.query<T>(
        query,
        params,
      );

      const insertId = rows[0][typeofModel.primaryKey as keyof T];
      const select = selectTemplate("postgres", typeofModel).selectById(
        insertId as string,
      );
      const { rows: savedModel } = await this.pgClient.query<T>(select);
      const model = savedModel[0] as T;
      return (await parseDatabaseDataIntoModelResponse(
        [model],
        typeofModel,
      )) as T;
    } catch (error) {
      queryError(error);
      throw new Error("Failed to execute insert query in transaction " + error);
    }
  }

  public async massiveInsertQuery<T extends Model>(
    query: string,
    params: any[],
    typeofModel: typeof Model,
  ): Promise<T[]> {
    if (!this.isTransactionStarted) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rows } = await this.pgClient.query(query, params);

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
  ): Promise<number> {
    if (!this.isTransactionStarted) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rows } = await this.pgClient.query(query, params);
      if (!rows.length) {
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
    if (!this.isTransactionStarted) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rows } = await this.pgClient.query(query, params);

      if (!rows[0].affectedRows) {
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

  public async queryUpdate<T extends Model>(
    query: string,
    params?: any[],
  ): Promise<number | null> {
    if (!this.isTransactionStarted) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rowCount }: QueryResult = await this.pgClient.query(
        query,
        params,
      );
      return rowCount;
    } catch (error) {
      queryError(error);
      throw new Error("Failed to execute update query in transaction " + error);
    }
  }

  public async queryDelete<T extends Model>(
    query: string,
    params?: any[],
  ): Promise<T | number | null> {
    if (!this.isTransactionStarted) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rowCount }: QueryResult = await this.pgClient.query(
        query,
        params,
      );
      return rowCount;
    } catch (error) {
      queryError(error);
      throw new Error("Failed to execute delete query in transaction " + error);
    }
  }

  /**
   * Start transaction.
   */
  async start(): Promise<void> {
    try {
      log(BEGIN_TRANSACTION, this.logs);
      await this.pgClient.query(BEGIN_TRANSACTION);
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
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(COMMIT_TRANSACTION, this.logs);
      await this.pgClient.query(COMMIT_TRANSACTION);
      await this.pgClient.end();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to commit transaction " + error);
    }
  }

  /**
   * Rollback transaction.
   */
  async rollback(): Promise<void> {
    if (!this.pgClient) {
      return;
    }

    try {
      log(ROLLBACK_TRANSACTION, this.logs);
      await this.pgClient.query(ROLLBACK_TRANSACTION);
      await this.pgClient.end();
    } catch (error) {
      queryError(error);
      await this.pgClient.end();
      throw new Error("Failed to rollback transaction " + error);
    }
  }
}
