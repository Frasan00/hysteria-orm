import { Model } from "../Models/Model";
import { WhereQueryBuilder } from "../QueryBuilder/WhereQueryBuilder";
import deleteTemplate from "../Resources/Query/DELETE";
import updateTemplate from "../Resources/Query/UPDATE";
import {
  SelectableType,
  TransactionType,
} from "../Models/ModelManager/ModelManagerTypes";
import { SqlConnectionType } from "../SqlDatasource";
import mysql from "mysql2/promise";
import { log } from "../../Logger";

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
   */
  public abstract softDelete(options?: {
    column?: SelectableType<T>;
    value?: string | number | boolean;
    trx?: TransactionType;
  }): Promise<T[]>;

  /**
   * @description Deletes Records from the database for the current query.
   * @param trx - The transaction to run the query in.
   */
  public abstract delete(trx?: TransactionType): Promise<T[]>;

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

  /**
   * @description Used to retrieve the data before the update in order to return the data after the update.
   * @param sqlConnection
   * @returns
   */
  protected async getBeforeUpdateQueryIds(
    sqlConnection: mysql.Connection,
  ): Promise<(string | number)[]> {
    const beforeUpdateData = await sqlConnection.query<mysql.RowDataPacket[]>(
      `SELECT * FROM ${this.table} ${this.joinQuery} ${this.whereQuery}`,
      this.whereParams,
    );

    return beforeUpdateData[0].map(
      (row: any) => row[this.model.primaryKey as string],
    ) as (string | number)[];
  }

  protected async getAfterUpdateQuery(
    sqlConnection: mysql.Connection,
    modelIds: (string | number)[],
  ): Promise<T[]> {
    const afterUpdateDataQuery = `SELECT * FROM ${this.table} ${
      this.joinQuery
    } WHERE ${this.model.primaryKey} IN (${Array(modelIds.length)
      .fill("?")
      .join(",")})`;

    log(afterUpdateDataQuery, this.logs, modelIds);
    const updatedData = await sqlConnection.query<mysql.RowDataPacket[]>(
      afterUpdateDataQuery,
      modelIds,
    );

    const results = updatedData[0] as T[];
    return Array.isArray(results) ? results : [results];
  }
}
