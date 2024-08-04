import { Pool, QueryResult, PoolClient } from "pg";
import { BEGIN_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { COMMIT_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { ROLLBACK_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { log, queryError } from "../../Logger";
import { Metadata, Model } from "../Models/Model";
import selectTemplate from "../Resources/Query/SELECT";
import { parseDatabaseDataIntoModelResponse } from "../serializer";

export class PostgresTransaction {
  protected pgPool: Pool;
  protected pgClient!: PoolClient;
  protected logs: boolean;

  constructor(pgPool: Pool, logs: boolean) {
    this.logs = logs;
    this.pgPool = pgPool;
  }

  public async queryInsert<T extends Model>(
    query: string,
    params: any[],
    metadata: Metadata,
  ): Promise<T> {
    if (!this.pgClient) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rows }: QueryResult<T> = await this.pgClient.query<T>(
        query,
        params,
      );

      const insertId = rows[0][metadata.primaryKey as keyof T];
      const select = selectTemplate(metadata.tableName, "postgres").selectById(
        insertId as string,
      );
      const { rows: savedModel } = await this.pgClient.query<T>(select);
      return savedModel[0];
    } catch (error) {
      queryError(error);
      throw new Error("Failed to execute insert query in transaction " + error);
    }
  }

  public async massiveInsertQuery<T extends Model>(
    query: string,
    params: any[],
  ): Promise<T[]> {
    if (!this.pgClient) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rows } = await this.pgClient.query(query, params);

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

  public async massiveUpdateQuery<T extends Model>(
    query: string,
    params: any[],
  ): Promise<T[]> {
    if (!this.pgClient) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rows } = await this.pgClient.query(query, params);

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

  public async massiveDeleteQuery<T extends Model>(
    query: string,
    params: any[],
  ): Promise<T[]> {
    if (!this.pgClient) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const { rows } = await this.pgClient.query(query, params);

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
  ): Promise<number | null> {
    if (!this.pgClient) {
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

  public async queryDelete(
    query: string,
    params?: any[],
  ): Promise<number | null> {
    if (!this.pgClient) {
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
      this.pgClient = await this.pgPool.connect();
      await this.pgClient.query(BEGIN_TRANSACTION);
      log(BEGIN_TRANSACTION, this.logs);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to start transaction " + error);
    }
  }

  /**
   * Commit transaction.
   */
  async commit(): Promise<void> {
    if (!this.pgClient) {
      throw new Error("PostgresTransaction not started.");
    }

    try {
      log(COMMIT_TRANSACTION, this.logs);
      await this.pgClient.query(COMMIT_TRANSACTION);
      this.pgClient.release();
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
      this.pgClient.release();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to rollback transaction " + error);
    }
  }
}
