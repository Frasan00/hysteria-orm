import { BEGIN_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { COMMIT_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { ROLLBACK_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { log, queryError } from "../../Logger";
import { Model } from "../Models/Model";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import sqlite3 from "sqlite3";

export class SQLiteTransaction {
  protected sqLite: sqlite3.Database;
  protected logs: boolean;

  constructor(sqLite: sqlite3.Database, logs: boolean) {
    this.logs = logs;
    this.sqLite = sqLite;
  }

  public async queryInsert<T extends Model>(
    query: string,
    params: any[],
    typeofModel: typeof Model,
  ): Promise<T> {
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    log(query, this.logs, params);
    const result = await this.promisifyQuery<T>(query, params);
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
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      const result = await this.promisifyQuery<T[]>(query, params);

      return (await parseDatabaseDataIntoModelResponse(
        result,
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
  ): Promise<T[]> {
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      return await this.promisifyQuery<T[]>(query, params);
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
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    log(query, this.logs, params);
    try {
      return await this.promisifyQuery<T[]>(query, params);
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
  ): Promise<T[]> {
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    log(query, this.logs, params);
    return await this.promisifyQuery<T[]>(query, params);
  }

  public async queryDelete<T extends Model>(
    query: string,
    params?: any[],
  ): Promise<T[]> {
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    log(query, this.logs, params);
    return await this.promisifyQuery<T[]>(query, params);
  }

  /**
   * Start transaction.
   */
  async start(): Promise<void> {
    try {
      log(BEGIN_TRANSACTION, this.logs);
      await this.promisifyQuery<void>(BEGIN_TRANSACTION, []);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to start transaction " + error);
    }
  }

  /**
   * Commit transaction.
   */
  async commit(): Promise<void> {
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    try {
      log(COMMIT_TRANSACTION, this.logs);
      await this.promisifyQuery<void>(COMMIT_TRANSACTION, []);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to commit transaction " + error);
    }
  }

  /**
   * Rollback transaction.
   */
  async rollback(): Promise<void> {
    if (!this.sqLite) {
      return;
    }

    try {
      log(ROLLBACK_TRANSACTION, this.logs);
      await this.promisifyQuery<void>(ROLLBACK_TRANSACTION, []);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to rollback transaction " + error);
    }
  }

  private promisifyQuery<T>(query: string, params: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.sqLite.get<T>(query, params, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  }
}
