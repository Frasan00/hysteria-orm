import { Model } from "../Models/Model";
import { WhereQueryBuilder } from "../QueryBuilder/WhereQueryBuilder";
import updateTemplate from "../Resources/Query/UPDATE";
import { TransactionType } from "../Models/ModelManager/ModelManagerTypes";
import { SqlConnectionType } from "../SqlDatasource";
import mysql from "mysql2/promise";
import { log } from "../../Logger";

export abstract class ModelUpdateQueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
  protected abstract sqlConnection: SqlConnectionType;
  protected abstract joinQuery: string;
  protected abstract updateTemplate: ReturnType<typeof updateTemplate>;
  protected abstract isNestedCondition: boolean;

  public abstract withData(
    data: Partial<T>,
    trx?: TransactionType,
  ): Promise<T[]>;
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
  ): this;
  public abstract orWhereBuilder(
    cb: (queryBuilder: ModelUpdateQueryBuilder<T>) => void,
  ): this;
  public abstract andWhereBuilder(
    cb: (queryBuilder: ModelUpdateQueryBuilder<T>) => void,
  ): this;
}
