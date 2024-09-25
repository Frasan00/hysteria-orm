import { Model } from "../Models/Model";
import { log, queryError } from "../../Logger";
import updateTemplate from "../Resources/Query/UPDATE";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import joinTemplate from "../Resources/Query/JOIN";
import { SqlDataSource } from "../SqlDatasource";
import { ModelUpdateQueryBuilder } from "../QueryBuilder/UpdateQueryBuilder";
import { SQLiteTransaction } from "./SQLiteTransaction";
import sqlite3 from "sqlite3";
import SqlModelManagerUtils from "../Models/ModelManager/ModelManagerUtils";

export class SQLiteUpdateQueryBuilder<
  T extends Model,
> extends ModelUpdateQueryBuilder<T> {
  protected sqlConnection: sqlite3.Database;
  protected joinQuery = "";
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected isNestedCondition = false;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;

  /**
   * @description Constructs a MysqlQueryBuilder instance.
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
    trx?: SQLiteTransaction,
  ): Promise<T[]> {
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

    params.push(...this.whereParams);
    if (trx) {
      return await trx.massiveUpdateQuery(query, params);
    }

    log(query, this.logs, params);
    try {
      const result = await this.promisifyQuery<T>(query, params);
      return (await parseDatabaseDataIntoModelResponse(
        result,
        this.model,
      )) as T[];
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
  ): SQLiteUpdateQueryBuilder<T> {
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
  ): SQLiteUpdateQueryBuilder<T> {
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
    cb: (queryBuilder: SQLiteUpdateQueryBuilder<T>) => void,
  ): this {
    const queryBuilder = new SQLiteUpdateQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils,
    );
    cb(queryBuilder as unknown as SQLiteUpdateQueryBuilder<T>);

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
    cb: (queryBuilder: SQLiteUpdateQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new SQLiteUpdateQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils,
    );
    cb(nestedBuilder as unknown as SQLiteUpdateQueryBuilder<T>);

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
    cb: (queryBuilder: SQLiteUpdateQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new SQLiteUpdateQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils,
    );
    cb(nestedBuilder as unknown as SQLiteUpdateQueryBuilder<T>);

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

  /**
   * @description Used to retrieve the data before the update in order to return the data after the update.
   * @param sqlConnection
   * @returns
   */
  protected async getBeforeUpdateQueryIds(): Promise<(string | number)[]> {
    const beforeUpdateData = await this.promisifyQuery<T[]>(
      `SELECT * FROM ${this.table} ${this.joinQuery} ${this.whereQuery}`,
      this.whereParams,
    );

    return beforeUpdateData[0].map(
      (row: any) => row[this.model.primaryKey as string],
    ) as (string | number)[];
  }

  protected async getAfterUpdateQuery(
    modelIds: (string | number)[],
  ): Promise<T[]> {
    const afterUpdateDataQuery = `SELECT * FROM ${this.table} ${
      this.joinQuery
    } WHERE ${this.model.primaryKey} IN (${Array(modelIds.length)
      .fill("?")
      .join(",")})`;

    log(afterUpdateDataQuery, this.logs, modelIds);
    const updatedData = await this.promisifyQuery<T>(
      afterUpdateDataQuery,
      modelIds,
    );

    return Array.isArray(updatedData) ? updatedData : [updatedData];
  }

  private promisifyQuery<T>(query: string, params: any): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      this.sqlConnection.all<T[]>(query, params, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result as T[]);
      });
    });
  }
}
