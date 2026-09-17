import { PassThrough, Readable } from "node:stream";
import { Model } from "../models/model";
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
      _passThrough: PassThrough & AsyncGenerator<Model>,
      row: any,
    ) => void | Promise<void>;
  };

  constructor(
    db: SqliteConnectionInstance,
    query: string,
    params: any[] = [],
    events: {
      onData?: (
        _passThrough: PassThrough & AsyncGenerator<Model>,
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
        } as PassThrough & AsyncGenerator<Model>;

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

  if (options.mode === "insertOne" || options.mode === "insertMany") {
    // SQLite ≥3.35 supports RETURNING: a single statement returns every inserted
    // row (including DB-generated defaults), so no per-row re-select is needed.
    const returningQuery = `${query} returning *`;
    return new Promise<T[]>((resolve, reject) => {
      sqliteDriver.all(returningQuery, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve((rows as T[]) || []);
      });
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
