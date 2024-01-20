import { Model } from "../Models/Model";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import {Pool, QueryResult} from "pg";
import whereTemplate, { WhereOperatorType } from "../Templates/Query/WHERE.TS";
import selectTemplate from "../Templates/Query/SELECT";
import { log } from "../../Logger";
import PostgresModelManagerUtils from "./PostgresModelManagerUtils";

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

  public async one(): Promise<T | null> {
    let query = this.selectQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }

    log(query, this.logs);
    const model = new this.model();
    try {
      const { rows }: { rows: QueryResult<T>[] } = await this.pgPool.query(query);
      const modelData = rows[0] as unknown as T;

      // merge model data into model
      Object.assign(model, modelData);

      // relations parsing on the queried model
      await PostgresModelManagerUtils.parseQueryBuilderRelations(
        model,
        this.relations,
        this.pgPool,
        this.logs,
      );

      return model as T;
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }

  public async many(): Promise<T[]> {
    let query = this.selectQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }

    query += this.groupFooterQuery();

    log(query, this.logs);
    const model = new this.model();
    try {
      const { rows }: { rows: QueryResult<T>[] } = await this.pgPool.query(query);
      return Promise.all(
        rows.map(async (row) => {
          const modelData = row as unknown as T;

          // merge model data into model
          Object.assign(model, modelData);

          // relations parsing on the queried model
          await PostgresModelManagerUtils.parseQueryBuilderRelations(
            model,
            this.relations,
            this.pgPool,
            this.logs,
          );

          return model as T;
        }),
      );
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }

  public select(...columns: string[]): PostgresQueryBuilder<T> {
    const select = selectTemplate(this.tableName);
    this.selectQuery = select.selectColumns(...columns);
    return this;
  }

  public addRelations(relations: string[]): PostgresQueryBuilder<T> {
    this.relations = relations;
    return this;
  }

  public where(
    column: string,
    operator: WhereOperatorType,
    value: string | number | boolean | Date,
  ): PostgresQueryBuilder<T> {
    if (this.whereQuery) {
      this.whereQuery += this.whereTemplate.andWhere(
        column,
        value.toString(),
        operator,
      );
      return this;
    }
    this.whereQuery = this.whereTemplate.where(
      column,
      value.toString(),
      operator,
    );
    return this;
  }

  public andWhere(
    column: string,
    operator: WhereOperatorType,
    value: string | number | boolean | Date,
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(
        column,
        value.toString(),
        operator,
      );
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhere(
      column,
      value.toString(),
      operator,
    );
    return this;
  }

  public andWhereBetween(
    column: string,
    min: string,
    max: string,
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

  public andWhereIn(column: string, values: string[]): PostgresQueryBuilder<T> {
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
    value: string | number | boolean | Date,
  ): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(
        column,
        value.toString(),
        operator,
      );
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhere(
      column,
      value.toString(),
      operator,
    );
    return this;
  }

  public orWhereBetween(
    column: string,
    min: string,
    max: string,
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

  public orWhereIn(column: string, values: string[]): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereIn(column, values);
    return this;
  }

  public orWhereNotBetween(
    column: string,
    min: string,
    max: string,
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
    values: string[],
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
    min: string,
    max: string,
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

  public whereIn(column: string, values: string[]): PostgresQueryBuilder<T> {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereIn(column, values);
    return this;
  }

  public whereNotBetween(
    column: string,
    min: string,
    max: string,
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

  public whereNotIn(column: string, values: string[]): PostgresQueryBuilder<T> {
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
