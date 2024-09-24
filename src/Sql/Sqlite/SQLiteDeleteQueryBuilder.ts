import { Model } from "../Models/Model";
import { log, queryError } from "../../Logger";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import deleteTemplate from "../Resources/Query/DELETE";
import joinTemplate from "../Resources/Query/JOIN";
import { SqlDataSource } from "../SqlDatasource";
import { DateTime } from "luxon";
import { SelectableType } from "../Models/ModelManager/ModelManagerTypes";
import updateTemplate from "../Resources/Query/UPDATE";
import { ModelDeleteQueryBuilder } from "../QueryBuilder/DeleteQueryBuilder";
import sqlite3 from "sqlite3";
import { SQLiteTransaction } from "./SQLiteTransaction";

export class SQLiteDeleteQueryBuilder<
  T extends Model,
> extends ModelDeleteQueryBuilder<T> {
  protected sqlConnection: sqlite3.Database;
  protected joinQuery;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected isNestedCondition = false;

  /**
   * @description Constructs a MysqlQueryBuilder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param sqlConnection - The Sqlite connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  public constructor(
    model: typeof Model,
    table: string,
    sqlConnection: sqlite3.Database,
    logs: boolean,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, table, logs, false, sqlDataSource);
    this.sqlConnection = sqlConnection;
    this.updateTemplate = updateTemplate(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = deleteTemplate(table, sqlDataSource.getDbType());
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
  }

  /**
   * @description Deletes Records from the database.
   * @param data - The data to update.
   * @param trx - The transaction to run the query in.
   * @returns The updated records.
   */
  public async delete(trx?: SQLiteTransaction): Promise<any> {
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery,
    );

    if (trx) {
      return await trx.massiveDeleteQuery(query, this.whereParams);
    }

    log(query, this.logs, this.whereParams);
    try {
      const result = await this.promisifyQuery<T[]>(query, this.whereParams);
      // return (await parseDatabaseDataIntoModelResponse(
      //   result,
      //   this.model,
      // )) as T[];
    } catch (error) {
      queryError(query);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Soft Deletes Records from the database.
   * @param column - The column to soft delete. Default is 'deletedAt'.
   * @param value - The value to set the column to. Default is the current date and time.
   * @param trx - The transaction to run the query in.
   * @returns The updated records.
   */
  public async softDelete(options?: {
    column?: SelectableType<T>;
    value?: string | number | boolean;
    trx?: SQLiteTransaction;
  }): Promise<T[]> {
    const {
      column = "deletedAt" as SelectableType<T>,
      value = DateTime.local().toString(),
      trx,
    } = options || {};
    let { query, params } = this.updateTemplate.massiveUpdate(
      [column as string],
      [value],
      this.whereQuery,
      this.joinQuery,
    );

    params = [...params, ...this.whereParams];

    if (trx) {
      return await trx.massiveUpdateQuery(query, params);
    }

    log(query, this.logs, params);
    try {
      const result = await this.promisifyQuery<T[]>(query, params);
      const models = await parseDatabaseDataIntoModelResponse(
        result,
        this.model,
      );
      if (!models) {
        return [];
      }

      return Array.isArray(models) ? models : ([models] as T[]);
    } catch (error) {
      queryError(query);
      throw new Error("Query failed " + error);
    }
  }

  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  public join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): SQLiteDeleteQueryBuilder<T> {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn as string,
      foreignColumn as string,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  public leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): SQLiteDeleteQueryBuilder<T> {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn as string,
      foreignColumn as string,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  public whereBuilder(
    cb: (queryBuilder: SQLiteDeleteQueryBuilder<T>) => void,
  ): this {
    const queryBuilder = new SQLiteDeleteQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(queryBuilder as unknown as SQLiteDeleteQueryBuilder<T>);

    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4); // 'AND '.length === 4 has to be removed from the beginning of the where condition
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3); // 'OR '.length === 3 has to be removed from the beginning of the where condition
    }

    whereCondition = "(" + whereCondition + ")";

    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition
        ? whereCondition
        : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }

    this.whereParams.push(...queryBuilder.whereParams);
    return this;
  }

  /**
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  public orWhereBuilder(
    cb: (queryBuilder: SQLiteDeleteQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new SQLiteDeleteQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as SQLiteDeleteQueryBuilder<T>);

    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }

    nestedCondition = `(${nestedCondition})`;

    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition
        ? nestedCondition
        : `WHERE ${nestedCondition}`;

      this.whereParams.push(...nestedBuilder.whereParams);
      return this;
    }

    this.whereQuery += ` OR ${nestedCondition}`;
    this.whereParams.push(...nestedBuilder.whereParams);

    return this;
  }

  /**
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  public andWhereBuilder(
    cb: (queryBuilder: SQLiteDeleteQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new SQLiteDeleteQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as SQLiteDeleteQueryBuilder<T>);

    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }

    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition
        ? nestedCondition
        : `WHERE ${nestedCondition}`;

      this.whereParams.push(...nestedBuilder.whereParams);
      return this;
    }

    this.whereQuery += ` AND ${nestedCondition}`;
    this.whereParams.push(...nestedBuilder.whereParams);

    return this;
  }

  private promisifyQuery<T>(query: string, params: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.sqlConnection.get<T>(query, params, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  }
}
