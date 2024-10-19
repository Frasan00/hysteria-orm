import { Model } from "../models/model";
import { Client } from "pg";
import deleteTemplate from "../resources/query/DELETE";
import joinTemplate from "../resources/query/JOIN";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { DateTime } from "luxon";
import updateTemplate from "../resources/query/UPDATE";
import {
  DeleteOptions,
  ModelDeleteQueryBuilder,
  SoftDeleteOptions,
} from "../query_builder/delete_query_builder";
import { log, queryError } from "../../utils/logger";

export class PostgresDeleteQueryBuilder<
  T extends Model,
> extends ModelDeleteQueryBuilder<T> {
  protected sqlConnection: Client;
  protected joinQuery;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected isNestedCondition = false;

  /**
   * @description Constructs a Mysql_query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param pgClient - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  public constructor(
    model: typeof Model,
    table: string,
    pgClient: Client,
    logs: boolean,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, table, logs, false, sqlDataSource);
    this.sqlConnection = pgClient;
    this.updateTemplate = updateTemplate(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = deleteTemplate(table, sqlDataSource.getDbType());
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
  }

  public async delete(options: DeleteOptions = {}): Promise<number> {
    const { ignoreBeforeDeleteHook } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }

    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery,
    );

    log(query, this.logs, this.params);
    try {
      const result = await this.sqlConnection.query<T>(query, this.params);
      if (!result.rows) {
        return 0;
      }

      return result.rowCount || 0;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }

  public async softDelete(options?: SoftDeleteOptions<T>): Promise<number> {
    const {
      column = "deletedAt",
      value = DateTime.local().toISO(),
      ignoreBeforeDeleteHook = false,
    } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }

    let { query, params } = this.updateTemplate.massiveUpdate(
      [column as string],
      [value],
      this.whereQuery,
      this.joinQuery,
    );

    params = [...params, ...this.params];

    log(query, this.logs, params);
    try {
      const result = await this.sqlConnection.query<T>(query, params);
      if (!result.rows) {
        return 0;
      }

      return result.rowCount || 0;
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
  ): PostgresDeleteQueryBuilder<T> {
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
  ): PostgresDeleteQueryBuilder<T> {
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
    cb: (queryBuilder: PostgresDeleteQueryBuilder<T>) => void,
  ): this {
    const queryBuilder = new PostgresDeleteQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
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

    this.params.push(...queryBuilder.params);
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
      this.table,
      this.sqlConnection,
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
    cb: (queryBuilder: PostgresDeleteQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresDeleteQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqlConnection,
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

      this.params.push(...nestedBuilder.params);
      return this;
    }

    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);

    return this;
  }
}
