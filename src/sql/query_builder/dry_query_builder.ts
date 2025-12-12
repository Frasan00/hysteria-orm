import { baseSoftDeleteDate } from "../../utils/date_utils";
import { DeleteNode } from "../ast/query/node/delete";
import { FromNode } from "../ast/query/node/from";
import { InsertNode } from "../ast/query/node/insert";
import { OnDuplicateNode } from "../ast/query/node/on_duplicate";
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
   * @warning This method does not run model or column hooks
   * @returns The query builder
   */
  // @ts-expect-error
  override insert(
    ...args: Parameters<typeof QueryBuilder.prototype.insert>
  ): this {
    const [data, options] = args;
    const insertObject = Object.fromEntries(
      Object.keys(data).map((column) => [
        column,
        data[column as keyof typeof data],
      ]),
    );

    this.insertNode = new InsertNode(this.fromNode, [insertObject], options);
    return this;
  }

  /**
   * @description Builds the insert many query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param args The arguments to pass to the insert many method
   * @warning This method does not run model or column hooks
   * @returns The query builder
   */
  // @ts-expect-error
  override insertMany(
    ...args: Parameters<typeof QueryBuilder.prototype.insertMany>
  ): this {
    const [data, options] = args;
    if (!data.length) {
      return this;
    }

    const models = data.map((model) => {
      return Object.fromEntries(
        Object.keys(model).map((column) => [
          column,
          model[column as keyof typeof model],
        ]),
      );
    });

    this.insertNode = new InsertNode(this.fromNode, models, options);
    return this;
  }

  /**
   * @description Builds the upsert query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param args The arguments to pass to the upsert method
   * @warning This method does not run model or column hooks
   * @returns The query builder
   */
  // @ts-expect-error
  override upsert(
    ...args: Parameters<typeof QueryBuilder.prototype.upsert>
  ): this {
    const [data, searchCriteria, options] = args;
    const columnsToUpdate = Object.keys(data);
    const conflictColumns = Object.keys(searchCriteria);

    this.insertNode = new InsertNode(
      new FromNode(this.model.table),
      [data],
      undefined,
      true,
    );

    this.onDuplicateNode = new OnDuplicateNode(
      this.model.table,
      conflictColumns,
      columnsToUpdate,
      (options?.updateOnConflict ?? true) ? "update" : "ignore",
      options?.returning as string[],
    );

    return this;
  }

  // @ts-expect-error
  override upsertMany(
    ...args: Parameters<typeof QueryBuilder.prototype.upsertMany>
  ): this {
    const [conflictColumns, columnsToUpdate, data, options] = args;
    const insertObjects: Record<string, any>[] = data.map((record) => {
      return Object.fromEntries(
        Object.keys(record).map((column) => [
          column,
          record[column as keyof typeof record],
        ]),
      );
    });

    this.insertNode = new InsertNode(
      new FromNode(this.model.table),
      insertObjects,
      undefined,
      true,
    );

    this.onDuplicateNode = new OnDuplicateNode(
      this.model.table,
      conflictColumns,
      columnsToUpdate,
      (options?.updateOnConflict ?? true) ? "update" : "ignore",
      options?.returning as string[],
    );

    return this;
  }

  /**
   * @description Builds the update query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @param data The data to update
   * @warning This method does not run model or column hooks
   * @returns The query builder
   */
  // @ts-expect-error
  override update(data: Record<string, WriteQueryParam>): this {
    this.updateNode = new UpdateNode(
      this.fromNode,
      Object.keys(data),
      Object.values(data),
    );
    return this;
  }

  /**
   * @description Builds the delete query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @warning This method does not run model or column hooks
   * @returns The query builder
   */
  // @ts-expect-error
  override delete(): this {
    this.deleteNode = new DeleteNode(this.fromNode);
    return this;
  }

  /**
   * @description Builds the truncate query statement without executing it, use 'unWrap' or 'toQuery' to get the query statement
   * @warning This method does not run model or column hooks
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
   * @warning This method does not run model or column hooks
   * @returns The query builder
   */
  // @ts-expect-error
  override softDelete(
    options: Omit<SoftDeleteOptions<any>, "ignoreBeforeDeleteHook"> = {},
  ): this {
    const { column = "deletedAt", value = baseSoftDeleteDate() } =
      options || {};

    this.updateNode = new UpdateNode(
      this.fromNode,
      [column as string],
      [value],
    );
    return this;
  }
}
