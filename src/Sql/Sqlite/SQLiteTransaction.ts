import { BEGIN_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { COMMIT_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { ROLLBACK_TRANSACTION } from "../Resources/Query/TRANSACTION";
import { log, queryError } from "../../Logger";
import { Model } from "../Models/Model";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import sqlite3 from "sqlite3";
import SqlModelManagerUtils from "../Models/ModelManager/ModelManagerUtils";

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
      [result[0] as T],
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
      const result = await this.promisifyQuery<T>(query, params);
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
  ): Promise<number> {
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    try {
      log(query, this.logs, params);
      return await this.promisifyQueryAffectedRows(query, params);
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
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    log(query, this.logs, params);
    try {
      return await this.promisifyQueryAffectedRows(query, params);
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
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    log(query, this.logs, params);
    return await this.promisifyQueryAffectedRows(query, params);
  }

  public async queryDelete<T extends Model>(
    query: string,
    params?: any[],
  ): Promise<number> {
    if (!this.sqLite) {
      throw new Error("SQLiteTransaction not started.");
    }

    log(query, this.logs, params);
    return await this.promisifyQueryAffectedRows(query, params);
  }

  /**
   * Start transaction.
   */
  async start(): Promise<void> {
    try {
      log(BEGIN_TRANSACTION, this.logs);
      await this.promisifyQuery(BEGIN_TRANSACTION, []);
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
      await this.promisifyQuery(COMMIT_TRANSACTION, []);
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
      await this.promisifyQuery(ROLLBACK_TRANSACTION, []);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to rollback transaction " + error);
    }
  }

  private promisifyQuery<T extends Model>(
    query: string,
    params: any,
    typeofModel?: typeof Model,
    sqlModelManagerUtils?: SqlModelManagerUtils<T>,
    options: {
      isCreate?: boolean;
      isMassiveCreate?: boolean;
      models?: T | T[];
    } = {
      isCreate: false,
      isMassiveCreate: false,
      models: [],
    },
  ): Promise<T[]> {
    if (options.isCreate || options.isMassiveCreate) {
      if (options.isCreate) {
        if (!typeofModel) {
          throw new Error("Model type is required for create operation");
        }

        const table = typeofModel.table;
        const sqLiteConnection = this.sqLite;
        return new Promise<T[]>((resolve, reject) => {
          sqLiteConnection.run(query, params, function (this: any, err: any) {
            if (err) {
              return reject(err);
            }

            const lastID = this.lastID;
            const selectQuery = `SELECT * FROM ${table} WHERE id = ?`;
            sqLiteConnection.get(selectQuery, [lastID], (err: any, row: T) => {
              if (err) {
                return reject(err);
              }

              resolve([row] as T[]);
            });
          });
        });
      }

      if (!Array.isArray(options.models)) {
        throw new Error(
          "Models should be an array when massive creating on sqlite",
        );
      }

      if (!typeofModel || !sqlModelManagerUtils) {
        throw new Error("Model type is required for create operation");
      }

      const models = options.models as T[];
      const table = typeofModel.table;
      const finalResult: T[] = [];
      const sqLiteConnection = this.sqLite;
      return new Promise<T[]>((resolve, reject) => {
        models.forEach((model) => {
          const { query, params } = sqlModelManagerUtils.parseInsert(
            model as any,
            typeofModel,
            "sqlite",
          );

          sqLiteConnection.run(query, params, function (err: any) {
            if (err) {
              return reject(err);
            }

            const lastID = this.lastID;
            const selectQuery = `SELECT * FROM ${table} WHERE id = ?`;
            sqLiteConnection.get(selectQuery, [lastID], (err: any, row: T) => {
              if (err) {
                return reject(err);
              }

              finalResult.push(row as T);
              if (finalResult.length === models.length) {
                resolve(finalResult);
              }
            });
          });
        });
      });
    }

    return new Promise<T[]>((resolve, reject) => {
      this.sqLite.all<T>(query, params, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  }

  private promisifyQueryAffectedRows(
    query: string,
    params: any,
  ): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.sqLite.run(query, params, function (this: any, err: any) {
        if (err) {
          return reject(err);
        }

        resolve(this.changes);
      });
    });
  }
}
