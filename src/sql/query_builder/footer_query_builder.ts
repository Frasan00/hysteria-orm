import { GroupByNode } from "../ast/query/node/group_by/group_by";
import { LimitNode } from "../ast/query/node/limit/limit";
import { OffsetNode } from "../ast/query/node/offset/offset";
import { OrderByNode } from "../ast/query/node/order_by/order_by";
import { ColumnType } from "../models/decorators/model_decorators_types";
import { Model } from "../models/model";
import type {
  ModelKey,
  OrderByChoices,
} from "../models/model_manager/model_manager_types";
import { SqlDataSource } from "../sql_data_source";
import { SelectableColumn } from "./query_builder_types";

export abstract class FooterQueryBuilder<T extends Model> {
  protected sqlDataSource: SqlDataSource;
  protected model: typeof Model;
  protected groupByNodes: GroupByNode[];
  protected orderByNodes: OrderByNode[];
  protected limitNode: LimitNode | null;
  protected offsetNode: OffsetNode | null;
  protected modelColumns: ColumnType[];
  protected modelColumnsMap: Map<string, ColumnType>;
  protected logs: boolean;

  protected constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    this.model = model;
    this.sqlDataSource = sqlDataSource;
    this.groupByNodes = [];
    this.orderByNodes = [];
    this.limitNode = null;
    this.offsetNode = null;
    this.logs = this.sqlDataSource.logs;
    const getColumnsFn = (this.model as any)?.getColumns;
    this.modelColumns =
      typeof getColumnsFn === "function" ? getColumnsFn.call(this.model) : [];
    this.modelColumnsMap = new Map(
      this.modelColumns.map((modelColumn) => [
        modelColumn.columnName,
        modelColumn,
      ]),
    );
  }

  clearGroupBy(): this {
    this.groupByNodes = [];
    return this;
  }

  clearOrderBy(): this {
    this.orderByNodes = [];
    return this;
  }

  clearLimit(): this {
    this.limitNode = null;
    return this;
  }

  clearOffset(): this {
    this.offsetNode = null;
    return this;
  }

  groupBy(...columns: ModelKey<T>[]): this;
  groupBy<S extends string>(...columns: SelectableColumn<S>[]): this;
  groupBy(...columns: (ModelKey<T> | SelectableColumn<string>)[]): this {
    columns.forEach((column) => {
      this.groupByNodes.push(new GroupByNode(column as string));
    });

    return this;
  }

  groupByRaw(query: string): this {
    this.groupByNodes.push(new GroupByNode(query, true));
    return this;
  }

  orderBy(column: ModelKey<T>, order: OrderByChoices): this;
  orderBy<S extends string>(
    column: SelectableColumn<S>,
    order: OrderByChoices,
  ): this;
  orderBy(
    column: ModelKey<T> | SelectableColumn<string>,
    order: OrderByChoices,
  ): this {
    this.orderByNodes.push(new OrderByNode(column as string, order));
    return this;
  }

  orderByRaw(query: string): this {
    this.orderByNodes.push(new OrderByNode(query, "asc", true));
    return this;
  }

  limit(limit: number): this {
    this.limitNode = new LimitNode(limit);
    return this;
  }

  offset(offset: number): this {
    this.offsetNode = new OffsetNode(offset);
    return this;
  }
}
