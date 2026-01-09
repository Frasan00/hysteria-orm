import logger from "../../utils/logger";
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

export abstract class FooterQueryBuilder<
  T extends Model,
  S extends Record<string, any> = Record<string, any>,
> {
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

  /**
   * @description Clears the group by query
   */
  clearGroupBy(): this {
    this.groupByNodes = [];
    return this;
  }

  /**
   * @description Clears the order by query
   */
  clearOrderBy(): this {
    this.orderByNodes = [];
    return this;
  }

  /**
   * @description Clears the limit query
   */
  clearLimit(): this {
    this.limitNode = null;
    return this;
  }

  /**
   * @description Clears the offset query
   */
  clearOffset(): this {
    this.offsetNode = null;
    return this;
  }

  /**
   * @description Adds a group by query
   */
  groupBy(...columns: ModelKey<T>[]): this;
  groupBy<S extends string>(...columns: SelectableColumn<S>[]): this;
  groupBy(...columns: (ModelKey<T> | SelectableColumn<string>)[]): this {
    columns.forEach((column) => {
      this.groupByNodes.push(new GroupByNode(column as string));
    });

    return this;
  }

  /**
   * @description Adds a raw group by query, GROUP BY clause is not necessary and will be added automatically
   */
  groupByRaw(query: string): this {
    this.groupByNodes.push(new GroupByNode(query, true));
    return this;
  }

  /**
   * @description Adds an order by query
   */
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

  /**
   * @description Adds a raw order by query, ORDER BY clause is not necessary and will be added automatically
   */
  orderByRaw(query: string): this {
    this.orderByNodes.push(new OrderByNode(query, "asc", true));
    return this;
  }

  /**
   * @description Adds a limit query
   */
  limit(limit: number): this {
    if (typeof limit !== "number") {
      logger.warn(
        `${this.model.name}::limit Non numeric value provided to \`limit\``,
      );
    }

    this.limitNode = new LimitNode(limit);
    return this;
  }

  /**
   * @description Adds an offset query
   */
  offset(offset: number): this {
    if (typeof offset !== "number") {
      logger.warn(
        `${this.model.name}::offset Non numeric value provided to \`offset\``,
      );
    }

    this.offsetNode = new OffsetNode(offset);
    return this;
  }
}
