import { baseSoftDeleteDate } from "../../utils/date_utils";
import { DeleteNode } from "../ast/query/node/delete";
import { InsertNode } from "../ast/query/node/insert";
import { TruncateNode } from "../ast/query/node/truncate";
import { UpdateNode } from "../ast/query/node/update";
import type { Model } from "../models/model";
import type { SqlDataSource } from "../sql_data_source";
import { SoftDeleteOptions } from "./delete_query_builder_type";
import { QueryBuilder } from "./query_builder";

/**
 * Allows to get queries without executing them
 */
export class DryQueryBuilder extends QueryBuilder {
  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
  }

  // @ts-expect-error
  override many(): this {
    return this;
  }

  /**
   * @description Builds the insert query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param args The arguments to pass to the insert method
   * @returns The query builder
   */
  // @ts-expect-error
  override insert(
    ...args: Parameters<typeof QueryBuilder.prototype.insert>
  ): this {
    const { columns: preparedColumns, values: preparedValues } =
      this.interpreterUtils.prepareColumns(
        Object.keys(args[0]),
        Object.values(args[0]),
        "insert",
      );

    const insertObject = Object.fromEntries(
      preparedColumns.map((column, index) => [column, preparedValues[index]]),
    );

    this.insertNode = new InsertNode(this.fromNode, [insertObject], args[1]);
    return this;
  }

  /**
   * @description Builds the insert many query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param args The arguments to pass to the insert many method
   * @returns The query builder
   */
  // @ts-expect-error
  override insertMany(
    ...args: Parameters<typeof QueryBuilder.prototype.insertMany>
  ): this {
    if (!args[0].length) {
      return this;
    }

    const models = args[0].map((model) => {
      const { columns: preparedColumns, values: preparedValues } =
        this.interpreterUtils.prepareColumns(
          Object.keys(model),
          Object.values(model),
          "insert",
        );

      return Object.fromEntries(
        preparedColumns.map((column, index) => [column, preparedValues[index]]),
      );
    });

    this.insertNode = new InsertNode(this.fromNode, models, args[1]);
    return this;
  }

  /**
   * @description Builds the upsert query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param args The arguments to pass to the upsert method
   * @returns The query builder
   */
  // @ts-expect-error
  override upsert(
    ...args: Parameters<typeof QueryBuilder.prototype.upsert>
  ): this {
    return this;
  }

  /**
   * @description Builds the update query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param data The data to update
   * @returns The query builder
   */
  // @ts-expect-error
  override update(data: Record<string, any>): this {
    const rawColumns = Object.keys(data);
    const rawValues = Object.values(data);

    const { columns, values } = this.interpreterUtils.prepareColumns(
      rawColumns,
      rawValues,
      "update",
    );

    this.updateNode = new UpdateNode(this.fromNode, columns, values);
    return this;
  }

  /**
   * @description Builds the delete query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @returns The query builder
   */
  // @ts-expect-error
  override delete(): this {
    this.deleteNode = new DeleteNode(this.fromNode);
    return this;
  }

  /**
   * @description Builds the truncate query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @returns The query builder
   */
  // @ts-expect-error
  override truncate(): this {
    this.truncateNode = new TruncateNode(this.fromNode);
    return this;
  }

  /**
   * @description Builds the soft delete query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param options Soft delete options
   * @returns The query builder
   */
  // @ts-expect-error
  override softDelete(
    options: Omit<SoftDeleteOptions<any>, "ignoreBeforeDeleteHook"> = {},
  ): this {
    const { column = "deletedAt", value = baseSoftDeleteDate() } =
      options || {};

    const { columns, values } = this.interpreterUtils.prepareColumns(
      [column as string],
      [value],
      "update",
    );

    this.updateNode = new UpdateNode(this.fromNode, columns, values);
    return this;
  }
}
