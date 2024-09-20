import { Connection } from "mysql2/promise";
import { Model } from "../Models/Model";
import { WhereQueryBuilder } from "../QueryBuilder/WhereQueryBuilder";
import updateTemplate from "../Resources/Query/UPDATE";
import { TransactionType } from "../Models/ModelManager/ModelManagerTypes";
import { Client } from "pg";

export abstract class AbstractUpdateQueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
  protected abstract sqlConnection: Connection | Client;
  protected abstract joinQuery: string;
  protected abstract updateTemplate: ReturnType<typeof updateTemplate>;
  protected abstract isNestedCondition: boolean;

  public abstract withData(
    data: Partial<T>,
    trx?: TransactionType,
  ): Promise<T[] | number>;
  public abstract join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): AbstractUpdateQueryBuilder<T>;
  public abstract leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): AbstractUpdateQueryBuilder<T>;
  public abstract whereBuilder(
    cb: (queryBuilder: AbstractUpdateQueryBuilder<T>) => void,
  ): this;
  public abstract orWhereBuilder(
    cb: (queryBuilder: AbstractUpdateQueryBuilder<T>) => void,
  ): this;
  public abstract andWhereBuilder(
    cb: (queryBuilder: AbstractUpdateQueryBuilder<T>) => void,
  ): this;
}
