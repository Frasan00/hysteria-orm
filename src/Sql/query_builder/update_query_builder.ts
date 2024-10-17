import { Model } from "../models/model";
import { Where_query_builder } from "./where_query_builder";
import updateTemplate from "../resources/query/UPDATE";
import { SqlConnectionType } from "../sql_data_source";

export type WithDataOptions = {
  ignoreBeforeUpdateHook?: boolean;
};

export abstract class ModelUpdateQueryBuilder<
  T extends Model,
> extends Where_query_builder<T> {
  protected abstract sqlConnection: SqlConnectionType;
  protected abstract joinQuery: string;
  protected abstract updateTemplate: ReturnType<typeof updateTemplate>;
  protected abstract isNestedCondition: boolean;

  /**
   * @description Updates a record in the database.
   * @param data
   * @param trx
   * @returns The number of affected rows.
   */
  public abstract withData(
    data: Partial<T>,
    options?: WithDataOptions,
  ): Promise<number>;
  public abstract join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): ModelUpdateQueryBuilder<T>;
  public abstract leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): ModelUpdateQueryBuilder<T>;
  public abstract whereBuilder(
    cb: (queryBuilder: ModelUpdateQueryBuilder<T>) => void,
  ): ModelUpdateQueryBuilder<T>;
  public abstract orWhereBuilder(
    cb: (queryBuilder: ModelUpdateQueryBuilder<T>) => void,
  ): ModelUpdateQueryBuilder<T>;
  public abstract andWhereBuilder(
    cb: (queryBuilder: ModelUpdateQueryBuilder<T>) => void,
  ): ModelUpdateQueryBuilder<T>;
}
