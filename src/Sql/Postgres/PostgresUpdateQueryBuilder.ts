import { Model } from "../Models/Model";
import { BaseValues, WhereOperatorType } from "../Templates/Query/WHERE.TS";
import { SelectableType } from "../Models/ModelManager/ModelManagerTypes";
import { log, queryError } from "../../Logger";
import { WhereQueryBuilder } from "../QueryBuilder/WhereQueryBuilder";
import updateTemplate from "../Templates/Query/UPDATE";
import { PostgresTransaction } from "./PostgresTransaction";
import { Pool } from "pg";
import { parseDatabaseDataIntoModelResponse } from "../serializer";

export class PostgresUpdateQueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
  protected pgPool: Pool;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
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
  ) {
    super(model, tableName, logs);
    this.pgPool = pgPool;
    this.updateTemplate = updateTemplate(
      tableName,
      this.model.sqlInstance.getDbType(),
    );
    this.isNestedCondition = isNestedCondition;
  }

  /**
   * @description Updates a record in the database.
   * @param data - The data to update.
   * @param trx - The transaction to run the query in.
   * @returns The updated records.
   */
  public async withData(
    data: Partial<T>,
    trx?: PostgresTransaction,
  ): Promise<T[]> {
    // TODO: Implement transactions
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
    );

    params.push(...this.whereParams);
    log(query, this.logs, params);
    try {
      const { rows } = await this.pgPool.query(query, params);
      if (!rows.length) {
        throw new Error("Failed to update");
      }

      return parseDatabaseDataIntoModelResponse(rows);
    } catch (error) {
      queryError(query);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Adds a WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public where(
    column: SelectableType<T>,
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
    cb: (queryBuilder: PostgresUpdateQueryBuilder<T>) => void,
  ): this {
    const queryBuilder = new PostgresUpdateQueryBuilder(
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
    );
    cb(queryBuilder as unknown as PostgresUpdateQueryBuilder<T>);

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
    cb: (queryBuilder: PostgresUpdateQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresUpdateQueryBuilder(
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
    );
    cb(nestedBuilder as unknown as PostgresUpdateQueryBuilder<T>);

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
    cb: (queryBuilder: PostgresUpdateQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresUpdateQueryBuilder(
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
    );
    cb(nestedBuilder as unknown as PostgresUpdateQueryBuilder<T>);

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
