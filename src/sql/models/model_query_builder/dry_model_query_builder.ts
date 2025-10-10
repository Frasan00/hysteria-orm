import { baseSoftDeleteDate } from "../../../utils/date_utils";
import { DeleteNode } from "../../ast/query/node/delete";
import { InsertNode } from "../../ast/query/node/insert";
import { TruncateNode } from "../../ast/query/node/truncate";
import { UpdateNode } from "../../ast/query/node/update";
import type { SqlDataSource } from "../../sql_data_source";
import type { Model } from "../model";
import { ModelQueryBuilder } from "./model_query_builder";

/**
 * Allows to get model queries without executing them
 */
export class DryModelQueryBuilder<
  T extends Model,
  A extends Record<string, any> = {},
  R extends Record<string, any> = {},
> extends ModelQueryBuilder<T, A, R> {
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
  override insert(...args: Parameters<typeof this.model.insert<T>>): this {
    const [data, options] = args;

    if (!options?.ignoreHooks) {
      this.model.beforeInsert?.(this);
    }

    const { columns: preparedColumns, values: preparedValues } =
      this.interpreterUtils.prepareColumns(
        Object.keys(data),
        Object.values(data),
        "insert",
      );

    const insertObject = Object.fromEntries(
      preparedColumns.map((column, index) => [column, preparedValues[index]]),
    );

    this.insertNode = new InsertNode(
      this.fromNode,
      [insertObject],
      options?.returning as string[],
    );
    return this;
  }

  /**
   * @description Builds the insert many query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param args The arguments to pass to the insert many method
   * @returns The query builder
   */
  // @ts-expect-error
  override insertMany(
    ...args: Parameters<typeof this.model.insertMany<T>>
  ): this {
    const [data, options] = args;

    if (!data.length) {
      return this;
    }

    if (!options?.ignoreHooks) {
      this.model.beforeInsert?.(this);
    }

    const models = data.map((model) => {
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

    this.insertNode = new InsertNode(
      this.fromNode,
      models,
      options?.returning as string[],
    );
    return this;
  }

  /**
   * @description Builds the update query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param data The data to update
   * @param options Update options
   * @returns The query builder
   */
  // @ts-expect-error
  override update(
    ...args: Parameters<ReturnType<typeof this.model.query<T>>["update"]>
  ): this {
    const [data, options] = args;

    if (!options?.ignoreBeforeUpdateHook) {
      this.model.beforeUpdate?.(this as any);
    }

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
   * @param options Delete options
   * @returns The query builder
   */
  // @ts-expect-error
  override delete(
    ...args: Parameters<ReturnType<typeof this.model.query<T>>["delete"]>
  ): this {
    const [options] = args;

    if (!options?.ignoreBeforeDeleteHook) {
      this.model.beforeDelete?.(this as any);
    }

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
    ...args: Parameters<ReturnType<typeof this.model.query<T>>["softDelete"]>
  ): this {
    const [options] = args;

    if (!options?.ignoreBeforeUpdateHook) {
      this.model.beforeUpdate?.(this as any);
    }

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
