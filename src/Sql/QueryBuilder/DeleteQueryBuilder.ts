import { Model } from "../Models/Model";
import { WhereQueryBuilder } from "../QueryBuilder/WhereQueryBuilder";
import { Connection } from "mysql2/promise";
import deleteTemplate from "../Resources/Query/DELETE";
import updateTemplate from "../Resources/Query/UPDATE";
import {
  SelectableType,
  TransactionType,
} from "../Models/ModelManager/ModelManagerTypes";
import { Client } from "pg";

export abstract class AbstractDeleteQueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
  protected abstract sqlConnection: Connection | Client;
  protected abstract joinQuery: string;
  protected abstract updateTemplate: ReturnType<typeof updateTemplate>;
  protected abstract deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected abstract isNestedCondition: boolean;

  public abstract softDelete(options?: {
    column?: SelectableType<T>;
    value?: string | number | boolean;
    trx?: TransactionType;
  }): Promise<T[] | number>;

  public abstract execute(trx?: TransactionType): Promise<T[] | number>;

  public abstract join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): AbstractDeleteQueryBuilder<T>;

  public abstract leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): AbstractDeleteQueryBuilder<T>;

  public abstract whereBuilder(
    cb: (queryBuilder: AbstractDeleteQueryBuilder<T>) => void,
  ): this;

  public abstract orWhereBuilder(
    cb: (queryBuilder: AbstractDeleteQueryBuilder<T>) => void,
  ): this;

  public abstract andWhereBuilder(
    cb: (queryBuilder: AbstractDeleteQueryBuilder<T>) => void,
  ): this;
}
