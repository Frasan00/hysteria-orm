/*
 * This class is used to make operations on models
 */
import { Metadata, Model } from "../Model";
import { FindOneType, FindType } from "./ModelManagerTypes";
import { MysqlQueryBuilder } from "../../Mysql/MysqlQueryBuilder";
import { MysqlTransaction } from "../../Mysql/MysqlTransaction";
import { PostgresTransaction } from "../../Postgres/PostgresTransaction";
import { PostgresQueryBuilder } from "../../Postgres/PostgresQueryBuilder";

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

  public abstract findOneById(
    id: string | number,
    throwErrorOnNull: boolean,
  ): Promise<T | null>;

  public abstract create(
    model: Partial<T>,
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<T | null>;

  public abstract massiveCreate(
    model: Partial<T>[],
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<T[]>;

  public abstract updateRecord(
    model: T,
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<T | null>;

  public abstract deleteByColumn(
    column: string,
    value: string | number | boolean,
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<number> | Promise<number | null>;

  public abstract delete(
    model: T,
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<T | null>;

  public abstract query(): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
}
