import { Model } from "../Models/Model";
import { WhereQueryBuilder } from "../QueryBuilder/WhereQueryBuilder";
import deleteTemplate from "../Resources/Query/DELETE";
import updateTemplate from "../Resources/Query/UPDATE";
import { SelectableType } from "../Models/ModelManager/ModelManagerTypes";
import { SqlConnectionType } from "../SqlDatasource";

export type DeleteOptions = {
  ignoreBeforeDeleteHook?: boolean;
};

export type SoftDeleteOptions<T> = {
  column?: SelectableType<T>;
  value?: string | number | boolean;
  ignoreBeforeDeleteHook?: boolean;
};

export abstract class ModelDeleteQueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
  protected abstract sqlConnection: SqlConnectionType;
  protected abstract joinQuery: string;
  protected abstract updateTemplate: ReturnType<typeof updateTemplate>;
  protected abstract deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected abstract isNestedCondition: boolean;

  /**
   * @description soft Deletes Records from the database.
   * @param options - The options for the soft delete, including the column to soft delete, the value to set the column to, and the transaction to run the query in.
   * @default column - 'deletedAt'
   * @default value - The current date and time.
   * @default ignoreBeforeDeleteHook - false
   * @default trx - undefined
   * @returns The number of affected rows.
   */
  public abstract softDelete(options?: SoftDeleteOptions<T>): Promise<number>;

  /**
   * @description Deletes Records from the database for the current query.
   * @param trx - The transaction to run the query in.
   * @returns The number of affected rows.
   */
  public abstract delete(options?: DeleteOptions): Promise<number>;

  public abstract join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): ModelDeleteQueryBuilder<T>;

  public abstract leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): ModelDeleteQueryBuilder<T>;

  public abstract whereBuilder(
    cb: (queryBuilder: ModelDeleteQueryBuilder<T>) => void,
  ): this;

  public abstract orWhereBuilder(
    cb: (queryBuilder: ModelDeleteQueryBuilder<T>) => void,
  ): this;

  public abstract andWhereBuilder(
    cb: (queryBuilder: ModelDeleteQueryBuilder<T>) => void,
  ): this;
}
