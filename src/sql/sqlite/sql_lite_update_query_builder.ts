import { Model } from "../models/model";
import { log, queryError } from "../../utils/logger";
import updateTemplate from "../resources/query/UPDATE";
import joinTemplate from "../resources/query/JOIN";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import {
  ModelUpdateQueryBuilder,
  WithDataOptions,
} from "../query_builder/update_query_builder";
import sqlite3 from "sqlite3";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";

export class SqliteUpdateQueryBuilder<
  T extends Model,
> extends ModelUpdateQueryBuilder<T> {
  protected sqlConnection: sqlite3.Database;
  protected joinQuery = "";
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected isNestedCondition = false;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;

  /**
   * @description Constructs a Mysql_query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param sqlLiteCOnnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  public constructor(
    model: typeof Model,
    table: string,
    sqlLiteConnection: sqlite3.Database,
    logs: boolean,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
    sqlModelManagerUtils: SqlModelManagerUtils<T>,
  ) {
    super(model, table, logs, false, sqlDataSource);
    this.sqlConnection = sqlLiteConnection;
    this.updateTemplate = updateTemplate(
      this.sqlDataSource.getDbType(),
      this.model,
    );
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
    this.sqlModelManagerUtils = sqlModelManagerUtils;
  }

  /**
   * @description Updates a record in the database.
   * @param data - The data to update.
   * @param trx - The transaction to run the query in.
   * @returns The updated records.
   */
  public async withData(
    data: Partial<T>,
    options?: WithDataOptions,
  ): Promise<number> {
    const { ignoreBeforeUpdateHook } = options || {};
    if (!ignoreBeforeUpdateHook) {
      this.model.beforeUpdate(this);
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
      values.length + 1,
    );
    const { query, params } = this.updateTemplate.massiveUpdate(
      columns,
      values,
      this.whereQuery,
      this.joinQuery,
    );

    params.push(...this.params);

    log(query, this.logs, params);
    try {
      const result = await this.promisifyQuery(query, params);
      return result;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
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
  ): SqliteUpdateQueryBuilder<T> {
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
  ): SqliteUpdateQueryBuilder<T> {
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
    cb: (queryBuilder: SqliteUpdateQueryBuilder<T>) => void,
  ): this {
    const queryBuilder = new SqliteUpdateQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils,
    );
    cb(queryBuilder as unknown as SqliteUpdateQueryBuilder<T>);

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

    this.params.push(...queryBuilder.params);
    return this;
  }

  /**
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  public orWhereBuilder(
    cb: (queryBuilder: SqliteUpdateQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new SqliteUpdateQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils,
    );
    cb(nestedBuilder as unknown as SqliteUpdateQueryBuilder<T>);

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

      this.params.push(...nestedBuilder.params);
      return this;
    }

    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);

    return this;
  }

  /**
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  public andWhereBuilder(
    cb: (queryBuilder: SqliteUpdateQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new SqliteUpdateQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils,
    );
    cb(nestedBuilder as unknown as SqliteUpdateQueryBuilder<T>);

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

      this.params.push(...nestedBuilder.params);
      return this;
    }

    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);

    return this;
  }

  private promisifyQuery(query: string, params: any): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.sqlConnection.run(query, params, function (this: any, err: any) {
        if (err) {
          return reject(err);
        }

        resolve(this.changes);
      });
    });
  }
}