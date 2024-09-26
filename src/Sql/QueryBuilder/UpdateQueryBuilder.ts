import { Model } from "../Models/Model";
import { WhereQueryBuilder } from "../QueryBuilder/WhereQueryBuilder";
import updateTemplate from "../Resources/Query/UPDATE";
import { TransactionType } from "../Models/ModelManager/ModelManagerTypes";
import { SqlConnectionType } from "../SqlDatasource";

export type WithDataOptions = {
  ignoreBeforeUpdateHook?: boolean;
  trx?: TransactionType;
};

export abstract class ModelUpdateQueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
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
