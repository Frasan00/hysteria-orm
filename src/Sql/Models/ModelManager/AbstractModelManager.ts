/*
 * This class is used to make operations on models
 */
import { Model } from "../Model";
import { FindOneType, FindType, TransactionType } from "./ModelManagerTypes";
import { MysqlQueryBuilder } from "../../Mysql/MysqlQueryBuilder";
import { PostgresQueryBuilder } from "../../Postgres/PostgresQueryBuilder";
import { MysqlUpdateQueryBuilder } from "../../Mysql/MysqlUpdateQueryBuilder";
import { PostgresUpdateQueryBuilder } from "../../Postgres/PostgresUpdateQueryBuilder";
import { PostgresDeleteQueryBuilder } from "../../Postgres/PostgresDeleteQueryBuilder";
import { MysqlDeleteQueryBuilder } from "../../Mysql/MysqlDeleteQueryBuilder";

export abstract class AbstractModelManager<T extends Model> {
  protected logs: boolean;
  protected model: typeof Model;
  protected modelInstance: T;
  protected throwError: boolean;

  protected constructor(model: typeof Model, logs: boolean) {
    this.logs = logs;
    this.model = model;
    this.throwError = false;
    this.modelInstance = new this.model() as T;
  }

  public abstract find(input?: FindType<T>): Promise<T[]>;

  public abstract findOne(input: FindOneType<T>): Promise<T | null>;

  public abstract findOneByPrimaryKey(
    value: string | number | boolean,
    throwErrorOnNull: boolean,
  ): Promise<T | null>;

  public abstract create(
    model: Partial<T>,
    trx?: TransactionType,
  ): Promise<T | null>;

  public abstract massiveCreate(
    model: Partial<T>[],
    trx?: TransactionType,
  ): Promise<T[]>;

  public abstract updateRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null>;

  public abstract deleteByColumn(
    column: string,
    value: string | number | boolean,
    trx?: TransactionType,
  ): Promise<number> | Promise<number | null>;

  public abstract deleteRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null>;

  public abstract query(): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;

  public abstract update():
    | MysqlUpdateQueryBuilder<T>
    | PostgresUpdateQueryBuilder<T>;

  public abstract delete():
    | MysqlDeleteQueryBuilder<T>
    | PostgresDeleteQueryBuilder<T>;
}
