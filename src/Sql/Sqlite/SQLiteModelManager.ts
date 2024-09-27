import { Model } from "../Models/Model";
import {
  FindOneType,
  FindType,
  TransactionType,
  UnrestrictedFindOneType,
  UnrestrictedFindType,
} from "../Models/ModelManager/ModelManagerTypes";
import { log, queryError } from "../../Logger";
import { AbstractModelManager } from "../Models/ModelManager/AbstractModelManager";
import { SqlDataSource } from "../SqlDatasource";
import SqlModelManagerUtils from "../Models/ModelManager/ModelManagerUtils";
import sqlite3 from "sqlite3";
import { SQLiteQueryBuilder } from "./SQLiteQueryBuilder";
import { SQLiteUpdateQueryBuilder } from "./SQLiteUpdateQueryBuilder";
import { SQLiteDeleteQueryBuilder } from "./SQLiteDeleteQueryBuilder";

export class SQLiteModelManager<
  T extends Model,
> extends AbstractModelManager<T> {
  protected sqLiteConnection: sqlite3.Database;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;

  /**
   * Constructor for SqLiteModelManager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Pool} sqLiteConnection - SQLite connection.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(
    model: typeof Model,
    sqLiteConnection: sqlite3.Database,
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
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  public async find(
    input?: FindType<T> | UnrestrictedFindType<T>,
  ): Promise<T[]> {
    try {
      if (!input) {
        return await this.query().many();
      }

      const query = this.query();
      if (input.select) {
        query.select(...(input.select as string[]));
      }

      if (input.relations) {
        query.addRelations(input.relations);
      }

      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }

      if (input.orderBy) {
        query.orderBy(input.orderBy.columns, input.orderBy.type);
      }

      if (input.limit) {
        query.limit(input.limit);
      }

      if (input.offset) {
        query.offset(input.offset);
      }

      if (input.groupBy) {
        query.groupBy(...input.groupBy);
      }

      return await query.many({ ignoreHooks: input.ignoreHooks || [] });
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - Query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  public async findOne(
    input: FindOneType<T> | UnrestrictedFindOneType<T>,
  ): Promise<T | null> {
    try {
      const query = this.query();
      if (input.select) {
        query.select(...(input.select as string[]));
      }

      if (input.relations) {
        query.addRelations(input.relations);
      }

      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }

      return await query.one({
        throwErrorOnNull: input.throwErrorOnNull || false,
        ignoreHooks: input.ignoreHooks || [],
      });
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
   * @returns Promise resolving to a single model or null if not found.
   */
  public async findOneByPrimaryKey(
    value: string | number | boolean,
    throwErrorOnNull: boolean = false,
  ): Promise<T | null> {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " +
            this.model.table +
            " has no primary key to be retrieved by",
        );
      }

      return await this.query()
        .where(this.model.primaryKey as string, value)
        .one({
          throwErrorOnNull,
        });
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {SqliteTransaction} trx - SqliteTransaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  public async insert(
    model: Partial<T>,
    trx?: TransactionType,
  ): Promise<T | null> {
    this.model.beforeinsert(model as T);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model as T,
      this.model,
      this.sqlDataSource.getDbType(),
    );

    if (trx) {
      return await trx.queryInsert<T>(query, params, this.model);
    }

    try {
      const { query, params } = this.sqlModelManagerUtils.parseInsert(
        model as T,
        this.model,
        this.sqlDataSource.getDbType(),
      );

      log(query, this.logs, params);
      return (await this.promisifyQuery<T>(query, params, {
        isCreate: true,
        models: model as T,
      })) as T;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {SqliteTransaction} trx - SqliteTransaction to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  public async insertMany(
    models: Partial<T>[],
    trx?: TransactionType,
  ): Promise<T[]> {
    models.forEach((model) => {
      this.model.beforeinsert(model as T);
    });

    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models as T[],
      this.model,
      this.sqlDataSource.getDbType(),
    );

    if (trx) {
      return await trx.massiveInsertQuery<T>(query, params, this.model);
    }

    try {
      const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
        models as T[],
        this.model,
        this.sqlDataSource.getDbType(),
      );
      log(query, this.logs, params);
      return (await this.promisifyQuery<T[]>(query, params, {
        isinsertMany: true,
        models: models as T[],
      })) as T[];
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {SqliteTransaction} trx - SqliteTransaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  public async updateRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null> {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " +
          this.model.table +
          " has no primary key to be updated, try save",
      );
    }

    if (trx) {
      const { query, params } = this.sqlModelManagerUtils.parseUpdate(
        model,
        this.model,
        this.sqlDataSource.getDbType(),
      );

      await trx.queryUpdate<T>(query, params);
      if (!this.model.primaryKey) {
        return null;
      }

      return await this.findOneByPrimaryKey(
        model[this.model.primaryKey as keyof T] as string | number,
      );
    }

    try {
      const updateQuery = this.sqlModelManagerUtils.parseUpdate(
        model,
        this.model,
        this.sqlDataSource.getDbType(),
      );

      log(updateQuery.query, this.logs, updateQuery.params);
      await this.promisifyQuery<T>(updateQuery.query, updateQuery.params);

      return await this.findOneByPrimaryKey(
        model[this.model.primaryKey as keyof T] as string | number,
      );
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param trx - SqliteTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public async deleteRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null> {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " +
            this.model.table +
            " has no primary key to be deleted from",
        );
      }
      const { query, params } = this.sqlModelManagerUtils.parseDelete(
        this.model.table,
        this.model.primaryKey,
        model[this.model.primaryKey as keyof T] as string,
      );

      if (trx) {
        await trx.queryDelete(query, params);
        return model;
      }

      log(query, this.logs, params);
      await this.promisifyQuery<T>(query, params);
      return model;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
   */
  public query(): SQLiteQueryBuilder<T> {
    return new SQLiteQueryBuilder<T>(
      this.model,
      this.model.table,
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }

  /**
   * @description Returns an update query builder.
   */
  public update(): SQLiteUpdateQueryBuilder<T> {
    return new SQLiteUpdateQueryBuilder<T>(
      this.model,
      this.model.table,
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource,
      this.sqlModelManagerUtils,
    );
  }

  /**
   * @description Returns a delete query builder.
   */
  public deleteQuery(): SQLiteDeleteQueryBuilder<T> {
    return new SQLiteDeleteQueryBuilder<T>(
      this.model,
      this.model.table,
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource,
      this.sqlModelManagerUtils,
    );
  }

  private promisifyQuery<T>(
    query: string,
    params: any,
    options: {
      isCreate?: boolean;
      isinsertMany?: boolean;
      models?: T | T[];
    } = {
      isCreate: false,
      isinsertMany: false,
      models: [],
    },
  ): Promise<T | T[]> {
    if (options.isCreate || options.isinsertMany) {
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

              const lastID = this.lastID;
              const selectQuery = `SELECT * FROM ${table} WHERE id = ?`;
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
      return new Promise<T[]>((resolve, reject) => {
        models.forEach((model) => {
          const { query, params } = this.sqlModelManagerUtils.parseInsert(
            model as any,
            this.model,
            this.sqlDataSource.getDbType(),
          );

          this.sqLiteConnection.run(query, params, function (err: any) {
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

    return new Promise<T>((resolve, reject) => {
      this.sqLiteConnection.all<T>(query, params, (err, rows) => {
        if (err) {
          return reject(err);
        }

        resolve(rows as T);
      });
    });
  }
}
