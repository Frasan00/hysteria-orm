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
  protected model: new () => T;
  protected modelInstance: T;
  public tableName: string;

  protected constructor(model: new () => T, logs: boolean) {
    this.logs = logs;
    this.model = model;
    this.modelInstance = new this.model();
    this.tableName = this.modelInstance.metadata.tableName;
  }

  public abstract getMetadata(): Metadata;

  public abstract find(input?: FindType): Promise<T[]>;

  public abstract findOne(input: FindOneType): Promise<T | null>;

  public abstract findOneById(id: string | number): Promise<T | null>;

  public abstract save(
    model: T,
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<T | null>;

  public abstract update(
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
