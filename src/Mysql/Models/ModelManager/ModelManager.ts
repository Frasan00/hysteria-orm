/*
 * This class is used to make operations on models
 */
import { Model } from "../Model";
import { FindOneType, FindType, TransactionType } from "./ModelManagerTypes";
import { Pool, RowDataPacket } from "mysql2/promise";
import selectTemplate from "../QueryTemplates/SELECT";
import ModelManagerQueryUtils from "./ModelManagerUtils";
import logger from "../../../Logger";
import MySqlUtils from "./MySqlUtils";

export class ModelManager<T extends Model> {
  protected logs: boolean;
  private mysqlConnection: Pool;
  protected model: new () => T;
  public tableName: string;

  constructor(model: new () => T, mysqlConnection: Pool, logs: boolean) {
    this.logs = logs;
    this.tableName = model.name;
    this.model = model;
    this.mysqlConnection = mysqlConnection;
  }

  public async find(input?: FindType): Promise<T[]> {
    try {
      if (!input) {
        const select = selectTemplate(this.tableName);
        this.log(select.selectAll);
        const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(
          select.selectAll,
        );
        return (
          rows.map((row) =>
            MySqlUtils.convertSqlResultToModel(row, this.model),
          ) || []
        );
      }

      const query = ModelManagerQueryUtils.parseSelectQueryInput(
        this.tableName,
        input,
      );
      this.log(query);
      const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
      return rows.map((row) =>
        MySqlUtils.convertSqlResultToModel(row, this.model),
      );
    } catch (error) {
      this.queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  public async findOne(input: FindOneType): Promise<T | null> {
    try {
      const query = ModelManagerQueryUtils.parseSelectQueryInput(
        this.tableName,
        input,
      );
      this.log(query);
      const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
      return MySqlUtils.convertSqlResultToModel(rows[0], this.model);
    } catch (error) {
      this.queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  public async findOneById(id: string | number): Promise<T | null> {
    const select = selectTemplate(this.tableName);
    try {
      const stringedId = typeof id === "number" ? id.toString() : id;
      const query = select.selectById(stringedId);
      this.log(query);
      const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
      return MySqlUtils.convertSqlResultToModel(rows[0], this.model);
    } catch (error) {
      this.queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  public async save(model: T): Promise<T> {
    try {
      const insertQuery = ModelManagerQueryUtils.parseInsert<T>(model);
      this.log(insertQuery);
      const [rows] =
        await this.mysqlConnection.query<RowDataPacket[]>(insertQuery);
      return MySqlUtils.convertSqlResultToModel(rows[0], this.model);
    } catch (error) {
      this.queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  public async update(model: T): Promise<T> {
    try {
      const updateQuery = ModelManagerQueryUtils.parseUpdate<T>(model);
      this.log(updateQuery);
      const [rows] =
        await this.mysqlConnection.query<RowDataPacket[]>(updateQuery);
      return MySqlUtils.convertSqlResultToModel(rows[0], this.model);
    } catch (error) {
      this.queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  public async delete(
    column: string,
    value: string | number | boolean,
  ): Promise<T> {
    try {
      const deleteQuery = ModelManagerQueryUtils.parseDelete<T>(
        this.tableName,
        column,
        value,
      );
      this.log(deleteQuery);
      const [rows] =
        await this.mysqlConnection.query<RowDataPacket[]>(deleteQuery);
      return MySqlUtils.convertSqlResultToModel(rows[0], this.model);
    } catch (error) {
      this.queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  // TO DO Trx

  private log(query: string) {
    if (!this.logs) {
      return;
    }

    logger.info("\n" + query);
  }
  private queryError(error: any) {
    logger.error("Query Failed ", error);
  }
}
