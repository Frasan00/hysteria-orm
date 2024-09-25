import { Model } from "../Models/Model";
import { log, queryError } from "../../Logger";
import { MysqlTransaction } from "./MysqlTransaction";
import { Connection } from "mysql2/promise";
import joinTemplate from "../Resources/Query/JOIN";
import deleteTemplate from "../Resources/Query/DELETE";
import { SqlDataSource } from "../SqlDatasource";
import { DateTime } from "luxon";
import updateTemplate from "../Resources/Query/UPDATE";
import { SelectableType } from "../Models/ModelManager/ModelManagerTypes";
import { ModelDeleteQueryBuilder } from "../QueryBuilder/DeleteQueryBuilder";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import mysql from "mysql2/promise";

export class MysqlDeleteQueryBuilder<
  T extends Model,
> extends ModelDeleteQueryBuilder<T> {
  protected sqlConnection: Connection;
  protected joinQuery;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected isNestedCondition = false;

  /**
   * @description Constructs a MysqlQueryBuilder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param mysqlConnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  public constructor(
    model: typeof Model,
    table: string,
    mysql: Connection,
    logs: boolean,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, table, logs, false, sqlDataSource);
    this.sqlConnection = mysql;
    this.updateTemplate = updateTemplate(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = deleteTemplate(table, sqlDataSource.getDbType());
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
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
    trx?: MysqlTransaction;
  }): Promise<T[]> {
    const {
      column = "deletedAt" as SelectableType<T>,
      value = DateTime.local().toISO(),
      trx,
    } = options || {};
    let { query, params } = this.updateTemplate.massiveUpdate(
      [column as string],
      [value],
      this.whereQuery,
      this.joinQuery,
    );

    params = [...params, ...this.whereParams];

    const modelIds = await this.getBeforeUpdateQueryIds();
    if (trx) {
      return await trx.massiveUpdateQuery(query, params, {
        typeofModel: this.model,
        modelIds: modelIds,
        primaryKey: this.model.primaryKey as string,
        table: this.model.table,
        joinClause: this.joinQuery,
      });
    }

    log(query, this.logs, params);
    try {
      const rows: any = await this.sqlConnection.query(query, params);
      if (!rows[0].affectedRows) {
        return [];
      }

      const updatedData = await this.getAfterUpdateQuery(modelIds);

      const data = await (parseDatabaseDataIntoModelResponse(
        updatedData,
        this.model,
      ) as Promise<T[]>);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      queryError(query);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Deletes Records from the database.
   * @param trx - The transaction to run the query in.
   * @returns The updated records.
   */
  public async delete(trx?: MysqlTransaction): Promise<T[]> {
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
    );

    const selectPreDeleteModelsQuery = `SELECT * FROM ${this.table} ${this.joinQuery} ${this.whereQuery};`;
    log(selectPreDeleteModelsQuery, this.logs, this.whereParams);
    const preDeleteModels = await this.sqlConnection.query(
      `SELECT * FROM ${this.table} ${this.joinQuery} ${this.whereQuery};`,
      this.whereParams,
    );

    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery,
    );

    if (trx) {
      return await trx.massiveDeleteQuery(
        query,
        this.whereParams,
        preDeleteModels[0] as T[],
        this.model,
      );
    }

    log(query, this.logs, this.whereParams);
    try {
      const rows: any = await this.sqlConnection.query(query, this.whereParams);

      if (!rows[0].affectedRows) {
        return [];
      }

      const data = await (parseDatabaseDataIntoModelResponse(
        preDeleteModels[0] as T[],
        this.model,
      ) as Promise<T[]>);
      return Array.isArray(data) ? data : [data];
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
  ): MysqlDeleteQueryBuilder<T> {
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
  ): MysqlDeleteQueryBuilder<T> {
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
    cb: (queryBuilder: MysqlDeleteQueryBuilder<T>) => void,
  ): this {
    const queryBuilder = new MysqlDeleteQueryBuilder(
      this.model as typeof Model,
      this.model.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(queryBuilder as unknown as MysqlDeleteQueryBuilder<T>);

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
    cb: (queryBuilder: MysqlDeleteQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new MysqlDeleteQueryBuilder(
      this.model as typeof Model,
      this.model.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as MysqlDeleteQueryBuilder<T>);

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
    cb: (queryBuilder: MysqlDeleteQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new MysqlDeleteQueryBuilder(
      this.model as typeof Model,
      this.model.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as MysqlDeleteQueryBuilder<T>);

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
    const beforeUpdateData = await this.sqlConnection.query<
      mysql.RowDataPacket[]
    >(
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
    const updatedData = await this.sqlConnection.query<mysql.RowDataPacket[]>(
      afterUpdateDataQuery,
      modelIds,
    );

    const results = updatedData[0] as T[];
    return Array.isArray(results) ? results : [results];
  }
}
