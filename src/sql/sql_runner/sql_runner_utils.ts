import { HysteriaError } from "../../errors/hysteria_error";
import { Model } from "../models/model";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import { SqlDataSource } from "../sql_data_source";
import { SqlLiteOptions } from "./sql_runner_types";

export const promisifySqliteQuery = <T extends Model>(
  query: string,
  params: any,
  sqlDataSource: SqlDataSource,
  options: SqlLiteOptions<T>,
): Promise<number | T | T[]> => {
  const isTransactional = ["begin", "commit", "rollback"].includes(
    query.trim().toLowerCase(),
  );

  const sqliteDriver = sqlDataSource.getCurrentDriverConnection("sqlite");
  if (isTransactional) {
    return new Promise<number>((resolve, reject) => {
      sqliteDriver.run(query, params, function (this: any, err) {
        if (err) {
          reject(err);
        }
        resolve(this.changes);
      });
    });
  }

  if (options.mode === "fetch") {
    return new Promise<T[]>((resolve, reject) => {
      sqliteDriver.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        }

        if (!rows || !rows.length) {
          resolve([] as T[]);
        }

        resolve(rows as T[]);
      });
    });
  }

  const typeofModel = options?.typeofModel;
  if (!typeofModel) {
    return new Promise<number>((resolve, reject) => {
      sqliteDriver.run(query, params, function (this: any, err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes as number);
        }
      });
    });
  }

  const primaryKeyName = typeofModel.primaryKey as string;
  const table = typeofModel.table;
  if (options.mode === "insertOne" || options.mode === "insertMany") {
    if (options.mode === "insertOne") {
      return new Promise<T>((resolve, reject) => {
        sqliteDriver.run(query, params, function (this: any, err: any) {
          if (err) {
            return reject(err);
          }

          const inputModel =
            options.models &&
            Array.isArray(options.models) &&
            options.models.length
              ? options.models[0]
              : null;

          if (!primaryKeyName) {
            resolve(inputModel as T);
            return;
          }

          const lastID = inputModel?.[primaryKeyName as keyof T] || this.lastID;

          if (!lastID) {
            return reject(
              new HysteriaError(
                "SqlRunnerUtils::promisifySqliteQuery",
                "MODEL_HAS_NO_PRIMARY_KEY",
              ),
            );
          }

          const selectQuery = `SELECT * FROM ${table} WHERE ${primaryKeyName} = ?`;
          sqliteDriver.get(selectQuery, [lastID], (err: any, row: T) => {
            if (err) {
              return reject(err);
            }

            resolve(row as T);
          });
        });
      });
    }

    if (!Array.isArray(options.models)) {
      throw new HysteriaError(
        "SqlRunnerUtils::massiveInsert models should be an array, report to the maintainers.",
        "DEVELOPMENT_ERROR",
      );
    }

    const models = options.models as T[];
    let finalResult: T[] = [];
    return new Promise<T[]>(async (resolve, reject) => {
      try {
        const insertPromises = models.map(async (model) => {
          const { query, params } = new SqlModelManagerUtils(
            sqlDataSource.getDbType(),
            sqlDataSource,
          ).parseInsert(model as Model, typeofModel, sqlDataSource.getDbType());

          return new Promise<T>((resolve, reject) => {
            sqliteDriver.run(query, params, function (err: any) {
              if (err) {
                return reject(err);
              }

              const lastID = model[primaryKeyName as keyof T] || this.lastID;
              if (!primaryKeyName) {
                resolve(model as T);
                return;
              }

              if (!lastID) {
                return reject(
                  new HysteriaError(
                    "SqlRunnerUtils::promisifySqliteQuery",
                    "MODEL_HAS_NO_PRIMARY_KEY",
                  ),
                );
              }

              const selectQuery = `SELECT * FROM ${table} WHERE ${primaryKeyName} = ?`;
              sqliteDriver.get(selectQuery, [lastID], (err: any, row: T) => {
                if (err) {
                  return reject(err);
                }

                resolve(row as T);
              });
            });
          });
        });

        finalResult = await Promise.all(insertPromises);
        resolve(finalResult);
      } catch (err) {
        reject(err);
      }
    });
  }

  return new Promise<number>((resolve, reject) => {
    sqliteDriver.run(query, params, function (this: { changes: number }, err) {
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve(this.changes as number);
      }
    });
  });
};
