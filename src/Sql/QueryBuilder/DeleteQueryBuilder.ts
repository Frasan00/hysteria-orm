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
import { SqlConnectionType } from "../SqlDatasource";

export abstract class ModelDeleteQueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
  protected abstract sqlConnection: SqlConnectionType;
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
