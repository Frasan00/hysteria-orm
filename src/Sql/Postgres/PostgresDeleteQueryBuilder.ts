import { Model } from "../Models/Model";
import { BaseValues, WhereOperatorType } from "../Resources/Query/WHERE.TS";
import { log, queryError } from "../../Logger";
import { WhereQueryBuilder } from "../QueryBuilder/WhereQueryBuilder";
import { PostgresTransaction } from "./PostgresTransaction";
import { Pool } from "pg";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import deleteTemplate from "../Resources/Query/DELETE";
import joinTemplate from "../Resources/Query/JOIN";
import { SqlDataSource } from "../SqlDatasource";
import { DateTime } from "luxon";
import { SelectableType } from "../Models/ModelManager/ModelManagerTypes";
import updateTemplate from "../Resources/Query/UPDATE";

export class PostgresDeleteQueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
  protected pgPool: Pool;
  protected joinQuery;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected isNestedCondition = false;

  /**
   * @description Constructs a MysqlQueryBuilder instance.
   * @param model - The model class associated with the table.
   * @param tableName - The name of the table.
   * @param mysqlPool - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  public constructor(
    model: typeof Model,
    tableName: string,
    pgPool: Pool,
    logs: boolean,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, tableName, logs, false, sqlDataSource);
    this.pgPool = pgPool;
    this.updateTemplate = updateTemplate(tableName, sqlDataSource.getDbType());
    this.deleteTemplate = deleteTemplate(tableName, sqlDataSource.getDbType());
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
  }

  /**
   * @description Deletes Records from the database.
   * @param data - The data to update.
   * @param trx - The transaction to run the query in.
   * @returns The updated records.
   */
  public async execute(trx?: PostgresTransaction): Promise<T[]> {
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery,
    );

    if (trx) {
      return await trx.massiveDeleteQuery(query, this.whereParams, this.model);
    }

    log(query, this.logs, this.whereParams);
    try {
      const result = await this.pgPool.query<T>(query, this.whereParams);
      if (!result.rows) {
        return [];
      }

      return await parseDatabaseDataIntoModelResponse(result.rows, this.model) as T[];
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
      value?: string | number | boolean | Date | DateTime;
      trx?: PostgresTransaction;
    }): Promise<T[]> {
      const {
        column = "deletedAt" as SelectableType<T>,
        value = DateTime.local().toString(),
        trx,
      } = options || {};
      let {query, params} = this.updateTemplate.massiveUpdate(
        [column as string],
        [value],
        this.whereQuery,
        this.joinQuery,
      );
  
      params = [...params, ...this.whereParams];
  
      if (trx) {
        return await trx.massiveUpdateQuery(query, params, this.model);
      }
  
      log(query, this.logs, params);
      try {
        const rows = await this.pgPool.query<T>(query, params);
        const models = await parseDatabaseDataIntoModelResponse(rows.rows, this.model);
        if (!models) {
          return [];
        }

        return Array.isArray(models) ? models : [models] as T[];
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
  ): PostgresDeleteQueryBuilder<T> {
    const join = joinTemplate(
      this.tableName,
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
  ): PostgresDeleteQueryBuilder<T> {
    const join = joinTemplate(
      this.tableName,
      relationTable,
      primaryColumn as string,
      foreignColumn as string,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  /**
   * @description Adds a WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public where(
    column: string,
    value: BaseValues,
    operator: WhereOperatorType = "=",
  ): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhere(
        column as string,
        value,
        operator,
      );
      this.whereQuery += query;
      this.whereParams.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.where(
      column as string,
      value,
      operator,
    );
    this.whereQuery = query;
    this.whereParams.push(...params);
    return this;
  }

  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  public whereBuilder(
    cb: (queryBuilder: PostgresDeleteQueryBuilder<T>) => void,
  ): this {
    const queryBuilder = new PostgresDeleteQueryBuilder(
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(queryBuilder as unknown as PostgresDeleteQueryBuilder<T>);

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
    cb: (queryBuilder: PostgresDeleteQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresDeleteQueryBuilder(
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as PostgresDeleteQueryBuilder<T>);

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
    cb: (queryBuilder: PostgresDeleteQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresDeleteQueryBuilder(
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as PostgresDeleteQueryBuilder<T>);

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
}
