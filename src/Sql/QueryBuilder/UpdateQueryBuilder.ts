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
