import { Model } from "../Models/Model";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Pool } from "pg";
import whereTemplate, {BaseValues, WhereOperatorType} from "../Templates/Query/WHERE.TS";
import selectTemplate from "../Templates/Query/SELECT";
import { log } from "../../Logger";
import {
  PaginatedData,
  parseDatabaseDataIntoModelResponse,
} from "../../CaseUtils";
import PostgresModelManagerUtils from "./PostgresModelManagerUtils";
import joinTemplate from "../Templates/Query/JOIN";

export class PostgresQueryBuilder<T extends Model> extends QueryBuilder<T> {
  protected pgPool: Pool;

  public constructor(
    model: new () => T,
    tableName: string,
    pgPool: Pool,
    logs: boolean,
  ) {
    super(model, tableName, logs);
    this.pgPool = pgPool;
  }

  private mergeRetrievedDataIntoModel(model: T, row: any) {
    Object.entries(row).forEach(([key, value]) => {
      if (Object.hasOwnProperty.call(model, key)) {
        Object.assign(model, { [key]: value });
      } else {
        model.aliasColumns[key] = value as string | number | boolean;
      }
    });
  }

  public async one(): Promise<T | null> {
    let query: string = '';
    if(this.joinQuery && !this.selectQuery) {
      const select = selectTemplate(this.tableName);
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;

    if (this.whereQuery) {
      query += this.whereQuery;
    }

    log(query, this.logs);
    const model = new this.model() as T;
    try {
      const result = await this.pgPool.query(query);
      const modelData = result.rows[0];

      if (modelData) {
        this.mergeRetrievedDataIntoModel(model, modelData);

        await PostgresModelManagerUtils.parseQueryBuilderRelations(
          model,
          this.relations,
          this.pgPool,
          this.logs,
        );

        return parseDatabaseDataIntoModelResponse([model]) as T;
      }

      return null;
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }

  public async many(): Promise<T[]> {
    let query: string = '';
    if(this.joinQuery && !this.selectQuery) {
      const select = selectTemplate(this.tableName);
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;

    if (this.whereQuery) {
      query += this.whereQuery;
    }

    query += this.groupFooterQuery();

    log(query, this.logs);
    const modelInstance = new this.model() as T;
    try {
      const result = await this.pgPool.query(query);
      const rows = result.rows;

      return Promise.all(
        rows.map(async (row) => {
          const modelData = row as T;

          const rowModel = new this.model() as T;
          this.mergeRetrievedDataIntoModel(rowModel, modelData);

          await PostgresModelManagerUtils.parseQueryBuilderRelations(
            rowModel,
            this.relations,
            this.pgPool,
            this.logs,
          );

          return parseDatabaseDataIntoModelResponse([rowModel]) as T;
        }),
      );
    } catch (error: any) {
      throw new Error("Query failed: " + error.message);
    }
  }

  /**
   * @description Paginates the query results with the given page and limit.
   * @param page
   * @param limit
   */
  public async paginate(
    page: number,
    limit: number,
  ): Promise<PaginatedData<T>> {
    const models = await this.many();
    return parseDatabaseDataIntoModelResponse(models, {
      page,
      limit,
    }) as PaginatedData<T>;
  }

  public select(...columns: string[]): PostgresQueryBuilder<T> {
    const select = selectTemplate(this.tableName);
    this.selectQuery = select.selectColumns(...columns);
    return this;
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
  ) : PostgresQueryBuilder<T> {
    const join = joinTemplate(this.tableName, relationTable, primaryColumn, foreignColumn);
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
  ): PostgresQueryBuilder<T> {
    const join = joinTemplate(this.tableName, relationTable, primaryColumn, foreignColumn);
    this.joinQuery += join.innerJoin();
    return this;
  }

  public addRelations(relations: string[]): PostgresQueryBuilder<T> {
    this.relations = relations;
    return this;
  }

  public where(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues
  ): PostgresQueryBuilder<T> {
    if (this.whereQuery) {
      this.whereQuery += this.whereTemplate.andWhere(
        column,
        value,
        operator,
      );
      return this;
    }
    this.whereQuery = this.whereTemplate.where(
      column,
      value,
      operator,
    );
    return this;
  }

  public andWhere(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(
        column,
        value,
        operator,
      );
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhere(
      column,
      value,
      operator,
    );
    return this;
  }

  public andWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhereBetween(
      column,
      min,
      max,
    );
    return this;
  }

  public andWhereIn(column: string, values: BaseValues[]): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhereIn(column, values);
    return this;
  }

  public andWhereNotNull(column: string): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhereNotNull(column);
    return this;
  }

  public andWhereNull(column: string): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhereNull(column);
    return this;
  }

  public groupBy(columns: string): PostgresQueryBuilder<T> {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }

  public limit(limit: number): PostgresQueryBuilder<T> {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }

  public offset(offset: number): PostgresQueryBuilder<T> {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }

  public orWhere(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(
        column,
        value,
        operator,
      );
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhere(
      column,
      value,
      operator,
    );
    return this;
  }

  public orWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereBetween(
      column,
      min,
      max,
    );
    return this;
  }

  public orWhereIn(column: string, values: BaseValues[]): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereIn(column, values);
    return this;
  }

  public orWhereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereNotBetween(
      column,
      min,
      max,
    );
    return this;
  }

  public orWhereNotIn(
    column: string,
    values: BaseValues[],
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereNotIn(
      column,
      values,
    );
    return this;
  }

  public orWhereNotNull(column: string): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereNotNull(column);
    return this;
  }

  public orWhereNull(column: string): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereNull(column);
    return this;
  }

  public orderBy(
    column: string[],
    order: "ASC" | "DESC",
  ): PostgresQueryBuilder<T> {
    this.orderByQuery = this.selectTemplate.orderBy(column, order);
    return this;
  }

  public rawAndWhere(query: string): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).rawAndWhere(query);
    return this;
  }

  public rawOrWhere(query: string): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).rawOrWhere(query);
    return this;
  }

  public rawWhere(query: string): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawAndWhere(query);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).rawWhere(query);
    return this;
  }

  public whereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereBetween(
      column,
      min,
      max,
    );
    return this;
  }

  public whereIn(column: string, values: BaseValues[]): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereIn(column, values);
    return this;
  }

  public whereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereNotBetween(
      column,
      min,
      max,
    );
    return this;
  }

  public whereNotIn(column: string, values: BaseValues[]): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereNotIn(column, values);
    return this;
  }

  public whereNotNull(column: string): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereNotNull(column);
    return this;
  }

  public whereNull(column: string): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereNull(column);
    return this;
  }
}
