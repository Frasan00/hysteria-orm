import { Model } from "../models/model";
import {
  FindOneType,
  FindType,
  UnrestrictedFindOneType,
  UnrestrictedFindType,
} from "../models/model_manager/model_manager_types";
import { log } from "../../utils/logger";
import { ModelManager } from "../models/model_manager/model_manager";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import { SqlLiteQueryBuilder } from "./sql_lite_query_builder";
import { SqliteConnectionInstance } from "../sql_data_source_types";
import { format } from "sql-formatter";

export class SqliteModelManager<T extends Model> extends ModelManager<T> {
  protected sqLiteConnection: SqliteConnectionInstance;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;

  /**
   * Constructor for SqLiteModelManager class.
   */
  constructor(
    model: typeof Model,
    sqLiteConnection: SqliteConnectionInstance,
    logs: boolean,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, logs, sqlDataSource);
    this.sqLiteConnection = sqLiteConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      "sqlite",
      sqLiteConnection,
    );
  }

  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   */
  async find(input?: FindType<T> | UnrestrictedFindType<T>): Promise<T[]> {
    if (!input) {
      return await this.query().many();
    }

    const query = this.query();
    if (input.select) {
      query.select(...(input.select as string[]));
    }

    if (input.relations) {
      input.relations.forEach((relation) => {
        query.with(relation);
      });
    }

    if (input.where) {
      Object.entries(input.where).forEach(([key, value]) => {
        query.where(key, value);
      });
    }

    if (input.orderBy) {
      Object.entries(input.orderBy).forEach(([key, value]) => {
        query.orderBy(key, value);
      });
    }

    if (input.limit) {
      query.limit(input.limit);
    }

    if (input.offset) {
      query.offset(input.offset);
    }

    if (input.groupBy) {
      query.groupBy(...(input.groupBy as string[]));
    }

    return await query.many({ ignoreHooks: input.ignoreHooks || [] });
  }

  /**
   * Find a single record from the database based on the input conditions.
   */
  async findOne(
    input: FindOneType<T> | UnrestrictedFindOneType<T>,
  ): Promise<T | null> {
    const results = await this.find({
      ...input,
      limit: 1,
    });

    if (!results.length) {
      return null;
    }

    return results[0];
  }

  /**
   * Find a single record by its PK from the database.
   */
  async findOneByPrimaryKey(value: string | number): Promise<T | null> {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be retrieved by",
      );
    }

    return await this.query()
      .where(this.model.primaryKey as string, value)
      .one();
  }

  /**
   * Save a new model instance to the database.
   */
  async insert(model: Partial<T>): Promise<T> {
    this.model.beforeInsert(model as T);

    let { query, params } = this.sqlModelManagerUtils.parseInsert(
      model as T,
      this.model,
      this.sqlDataSource.getDbType(),
    );

    // Seen the peculiar behavior of sqlite3 it does not use execSql method
    query = format(query, {
      language: "sqlite",
    });
    log(query, this.logs, params);
    return (await this.promisifyQuery<T>(query, params, {
      isCreate: true,
      models: model as T,
    })) as T;
  }

  /**
   * Create multiple model instances in the database.
   */
  async insertMany(models: Partial<T>[]): Promise<T[]> {
    models.forEach((model) => {
      this.model.beforeInsert(model as T);
    });

    let { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models as T[],
      this.model,
      this.sqlDataSource.getDbType(),
    );

    // Seen the peculiar behavior of sqlite3 it does not use execSql method
    query = format(query, {
      language: "sqlite",
    });
    log(query, this.logs, params);
    return (await this.promisifyQuery<T[]>(query, params, {
      isInsertMany: true,
      models: models as T[],
    })) as T[];
  }

  /**
   */
  async updateRecord(model: T): Promise<T | null> {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " +
          this.model.table +
          " has no primary key to be updated, try save",
      );
    }

    const updateQuery = this.sqlModelManagerUtils.parseUpdate(
      model,
      this.model,
      this.sqlDataSource.getDbType(),
    );

    updateQuery.query = format(updateQuery.query, {
      language: "sqlite",
    });
    log(updateQuery.query, this.logs, updateQuery.params);
    await this.promisifyQuery<T>(updateQuery.query, updateQuery.params);

    return await this.findOneByPrimaryKey(
      model[this.model.primaryKey as keyof T] as string | number,
    );
  }

  /**
   * @description Delete a record from the database from the given model.
   */
  async deleteRecord(model: T): Promise<T | null> {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be deleted from",
      );
    }
    let { query, params } = this.sqlModelManagerUtils.parseDelete(
      this.model.table,
      this.model.primaryKey,
      model[this.model.primaryKey as keyof T] as string,
    );

    query = format(query);
    log(query, this.logs, params);
    await this.promisifyQuery<T>(query, params);
    return model;
  }

  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   */
  query(): SqlLiteQueryBuilder<T> {
    return new SqlLiteQueryBuilder<T>(
      this.model,
      this.model.table,
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }

  private promisifyQuery<T>(
    query: string,
    params: any,
    options: {
      isCreate?: boolean;
      isInsertMany?: boolean;
      models?: T | T[];
    } = {
      isCreate: false,
      isInsertMany: false,
      models: [],
    },
  ): Promise<T | T[]> {
    const primaryKeyName = this.model.primaryKey as string;
    if (options.isCreate || options.isInsertMany) {
      if (options.isCreate) {
        const table = this.model.table;
        const sqLiteConnection = this.sqLiteConnection;
        return new Promise<T>((resolve, reject) => {
          this.sqLiteConnection.run(
            query,
            params,
            function (this: any, err: any) {
              if (err) {
                return reject(err);
              }

              const currentModel = options.models as T;
              const lastID =
                currentModel[primaryKeyName as keyof T] || this.lastID;
              const selectQuery = `SELECT * FROM ${table} WHERE ${primaryKeyName} = ?`;
              sqLiteConnection.get(
                selectQuery,
                [lastID],
                (err: any, row: T) => {
                  if (err) {
                    return reject(err);
                  }

                  resolve(row as T);
                },
              );
            },
          );
        });
      }

      if (!Array.isArray(options.models)) {
        throw new Error(
          "Models should be an array when massive creating on sqlite",
        );
      }

      const models = options.models as T[];
      const table = this.model.table;
      const finalResult: T[] = [];
      const sqLiteConnection = this.sqLiteConnection;
      return new Promise<T[]>(async (resolve, reject) => {
        for (const model of models) {
          try {
            const { query, params } = this.sqlModelManagerUtils.parseInsert(
              model as any,
              this.model,
              this.sqlDataSource.getDbType(),
            );

            await new Promise<void>((resolve, reject) => {
              this.sqLiteConnection.run(query, params, function (err: any) {
                if (err) {
                  return reject(err);
                }

                const lastID = model[primaryKeyName as keyof T] || this.lastID;
                const selectQuery = `SELECT * FROM ${table} WHERE ${primaryKeyName} = ?`;
                sqLiteConnection.get(
                  selectQuery,
                  [lastID],
                  (err: any, row: T) => {
                    if (err) {
                      return reject(err);
                    }

                    finalResult.push(row as T);
                    resolve();
                  },
                );
              });
            });
          } catch (err) {
            return reject(err);
          }
        }
        resolve(finalResult);
      });
    }

    return new Promise<T>((resolve, reject) => {
      this.sqLiteConnection.all(query, params, (err, rows) => {
        if (err) {
          return reject(err);
        }

        resolve(rows as T);
      });
    });
  }
}
