import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import joinTemplate from "../resources/query/JOIN";
import { SqlDataSource } from "../sql_data_source";
import { FooterQueryBuilder } from "./footer_query_builder";

export abstract class JoinQueryBuilder<
  T extends Model,
> extends FooterQueryBuilder<T> {
  protected joinQuery: string;

  protected constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.joinQuery = "";
  }

  clearJoin(): this {
    this.joinQuery = "";
    return this;
  }

  joinRaw(query: string): this {
    this.joinQuery += ` ${query} `;
    return this;
  }

  /**
   * @alias join
   *  @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table
   * @param primaryColumn - The primary column of the current model
   */
  innerJoin(
    relationTable: string,
    referencingColumn: string,
    primaryColumn: string,
  ): this;
  innerJoin(relationTable: string, referencingColumn: string): this;
  innerJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
  ): this;
  innerJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
  ): this;
  innerJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn: string | ModelKey<R> | ModelKey<T>,
    primaryColumn?: string | ModelKey<T>,
  ): this {
    this.innerJoin(
      typeof relationTable === "string" ? relationTable : relationTable.table,
      referencingColumnOrPrimaryColumn as string,
      primaryColumn as string,
    );

    return this;
  }

  /**
   * @description Join a table with the current model
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table
   * @param primaryColumn - The primary column of the current model
   */
  join(
    relationTable: string,
    referencingColumn: string,
    primaryColumn: string,
  ): this;
  join(relationTable: string, referencingColumn: string): this;
  join<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
  ): this;
  join<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
  ): this;
  join<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn: string | ModelKey<R> | ModelKey<T>,
    primaryColumn?: string | ModelKey<T>,
  ): this {
    if (!primaryColumn) {
      primaryColumn = this.model.primaryKey as string;
    }

    const join = joinTemplate(
      this.model,
      typeof relationTable === "string" ? relationTable : relationTable.table,
      primaryColumn as string,
      referencingColumnOrPrimaryColumn as string,
    );

    this.joinQuery += join.innerJoin();
    return this;
  }

  /**
   * @description Join a table with the current model
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table
   * @param primaryColumn - The primary column of the current model
   */
  leftJoin(
    relationTable: string,
    referencingColumn: string,
    primaryColumn: string,
  ): this;
  leftJoin(relationTable: string, referencingColumn: string): this;
  leftJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
  ): this;
  leftJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
  ): this;
  leftJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn: string | ModelKey<R> | ModelKey<T>,
    primaryColumn?: string | ModelKey<T>,
  ): this {
    if (!primaryColumn) {
      primaryColumn = this.model.primaryKey as string;
    }

    const join = joinTemplate(
      this.model,
      typeof relationTable === "string" ? relationTable : relationTable.table,
      primaryColumn as string,
      referencingColumnOrPrimaryColumn as string,
    );

    this.joinQuery += join.leftJoin();
    return this;
  }

  /**
   * @description Join a table with the current model
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table
   * @param primaryColumn - The primary column of the current model
   */
  rightJoin(
    relationTable: string,
    referencingColumn: string,
    primaryColumn: string,
  ): this;
  rightJoin(relationTable: string, referencingColumn: string): this;
  rightJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
  ): this;
  rightJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
  ): this;
  rightJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn: string | ModelKey<R> | ModelKey<T>,
    primaryColumn?: string | ModelKey<T>,
  ): this {
    if (!primaryColumn) {
      primaryColumn = this.model.primaryKey as string;
    }

    const join = joinTemplate(
      this.model,
      typeof relationTable === "string" ? relationTable : relationTable.table,
      primaryColumn as string,
      referencingColumnOrPrimaryColumn as string,
    );

    this.joinQuery += join.rightJoin();
    return this;
  }
}
