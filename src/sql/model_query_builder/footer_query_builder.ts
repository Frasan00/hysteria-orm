import { convertCase } from "../../utils/case_utils";
import { Model } from "../models/model";
import type {
  ModelKey,
  OrderByChoices,
} from "../models/model_manager/model_manager_types";
import selectTemplate from "../resources/query/SELECT";
import { SqlDataSource } from "../sql_data_source";

export abstract class FooterQueryBuilder<T extends Model> {
  protected sqlDataSource: SqlDataSource;
  protected model: typeof Model;
  protected groupByQuery: string;
  protected orderByQuery: string;
  protected limitQuery: string;
  protected offsetQuery: string;
  protected selectTemplate: ReturnType<typeof selectTemplate>;
  protected logs: boolean;

  protected constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    this.model = model;
    this.sqlDataSource = sqlDataSource;
    this.selectTemplate = selectTemplate(
      this.sqlDataSource.getDbType(),
      this.model,
    );

    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
    this.logs = this.sqlDataSource.logs;
  }

  clearGroupBy(): this {
    this.groupByQuery = "";
    return this;
  }

  clearOrderBy(): this {
    this.orderByQuery = "";
    return this;
  }

  clearLimit(): this {
    this.limitQuery = "";
    return this;
  }

  clearOffset(): this {
    this.offsetQuery = "";
    return this;
  }

  groupBy(...columns: ModelKey<T>[]): this;
  groupBy(...columns: string[]): this;
  groupBy(...columns: (ModelKey<T> | string)[]): this {
    this.groupByQuery = this.selectTemplate.groupBy(...(columns as string[]));
    return this;
  }

  groupByRaw(query: string): this {
    query.replace("GROUP BY", "");
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }

  orderBy(column: ModelKey<T>, order: OrderByChoices): this;
  orderBy(column: string, order: OrderByChoices): this;
  orderBy(column: ModelKey<T> | string, order: OrderByChoices): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );

    if (this.orderByQuery) {
      this.orderByQuery += `, ${casedColumn as string} ${order}`;
      return this;
    }

    this.orderByQuery = ` ORDER BY ${casedColumn as string} ${order}`;
    return this;
  }

  orderByRaw(query: string): this {
    if (this.orderByQuery) {
      this.orderByQuery += `, ${query}`;
      return this;
    }

    this.orderByQuery = ` ORDER BY ${query}`;
    return this;
  }

  limit(limit: number): this {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }

  offset(offset: number): this {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }
}
