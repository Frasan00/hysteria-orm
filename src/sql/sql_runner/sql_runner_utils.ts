import { PassThrough, Readable } from "node:stream";
import { HysteriaError } from "../../errors/hysteria_error";
import { AstParser } from "../ast/parser";
import { FromNode } from "../ast/query/node/from";
import { InsertNode } from "../ast/query/node/insert";
import { InterpreterUtils } from "../interpreter/interpreter_utils";
import { Model } from "../models/model";
import { AnnotatedModel } from "../models/model_query_builder/model_query_builder_types";
import { SqlDataSource } from "../sql_data_source";
import { SqliteConnectionInstance } from "../sql_data_source_types";
import { SqlLiteOptions } from "./sql_runner_types";

export class SQLiteStream extends Readable {
  private db: SqliteConnectionInstance;
  private query: string;
  private params: any[];
  private started: boolean;
  private events: {
    onData?: (
      _passThrough: PassThrough & AsyncGenerator<AnnotatedModel<Model, {}, {}>>,
      row: any,
    ) => void | Promise<void>;
  };

  constructor(
    db: SqliteConnectionInstance,
    query: string,
    params: any[] = [],
    events: {
      onData?: (
        _passThrough: PassThrough &
          AsyncGenerator<AnnotatedModel<Model, {}, {}>>,
        row: any,
      ) => void | Promise<void>;
    },
  ) {
    super({ objectMode: true });
    this.db = db;
    this.query = query;
    this.params = params;
    this.started = false;
    this.events = events;
  }

  _read(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.readRows();
  }

  private readRows(): void {
    let pending = 0;
    let ended = false;
    let hasError = false;

    this.db.each(
      this.query,
      this.params,
      (err: any, row: any) => {
        if (err) {
          hasError = true;
          this.emit("error", err);
          return;
        }

        pending++;

        let wroteFlag = false;
        let wroteValue: any;

        const mockPassThrough = {
          write: (v: any) => {
            wroteFlag = true;
            wroteValue = v;
          },
        } as PassThrough & AsyncGenerator<AnnotatedModel<Model, {}, {}>>;

        Promise.resolve(this.events.onData?.(mockPassThrough, row))
          .then(() => {
            if (hasError) {
              return;
            }

            if (wroteFlag) {
              this.push(wroteValue);
              return;
            }

            this.push(row);
          })
          .catch((err: any) => {
            hasError = true;
            this.emit("error", err);
          })
          .finally(() => {
            pending--;
            if (ended && pending === 0 && !hasError) {
              this.push(null);
            }
          });
      },
      (err: any) => {
        if (err) {
          hasError = true;
          this.emit("error", err);
          return;
        }

        ended = true;
        if (pending === 0 && !hasError) {
          this.push(null);
        }
      },
    );
  }
}

export const promisifySqliteQuery = <T extends Model>(
  query: string,
  params: any,
  sqlDataSource: SqlDataSource,
  options: SqlLiteOptions<T>,
): Promise<number | T | T[]> => {
  const isTransactional = [
    "begin",
    "begin transaction",
    "commit",
    "rollback",
  ].includes(query.trim().toLowerCase());

  const sqliteDriver =
    options.customConnection ??
    (sqlDataSource.getPool() as SqliteConnectionInstance);

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
      return new Promise<T[]>((resolve, reject) => {
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
            resolve([inputModel] as T[]);
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

            resolve([row] as T[]);
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

    if (!primaryKeyName) {
      return new Promise<T[]>((resolve, reject) => {
        sqliteDriver.run(query, params, function (err: any) {
          if (err) {
            return reject(err);
          }
          resolve(models as T[]);
        });
      });
    }

    let finalResult: T[] = [];
    return new Promise<T[]>(async (resolve, reject) => {
      try {
        const insertPromises = models.map(async (model) => {
          const interpreterUtils = new InterpreterUtils(typeofModel);

          const { columns: preparedColumns, values: preparedValues } =
            await interpreterUtils.prepareColumns(
              Object.keys(model),
              Object.values(model),
              "insert",
            );

          const preparedModel = Object.fromEntries(
            preparedColumns.map((column, index) => [
              column,
              preparedValues[index],
            ]),
          );

          const astParser = new AstParser(
            typeofModel,
            sqlDataSource.getDbType(),
          );

          const { sql: query, bindings: params } = astParser.parse([
            new InsertNode(new FromNode(typeofModel.table), [preparedModel]),
          ]);

          return new Promise<T>((resolve, reject) => {
            sqliteDriver.run(query, params, function (err: any) {
              if (err) {
                return reject(err);
              }

              const lastID = model[primaryKeyName as keyof T] || this.lastID;

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
    (sqliteDriver as SqliteConnectionInstance).run(
      query,
      params,
      function (this: { changes: number }, err: Error | null) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes as number);
        }
      },
    );
  });
};
