/*
 * This class is used to make operations on models
 */
import { Model } from "../Model";
import { FindType } from "./ModelManagerTypes";
import { Pool, RowDataPacket } from "mysql2/promise";
import selectTemplate from "../QueryTemplates/SELECT";
import ModelManagerQueryUtils from "./ModelManagerUtils";
import logger from "../../../Logger";
import MySqlUtils from "./MySqlUtils";

export class ModelManager<T extends Model> {
  readonly logs: boolean;
  private mysqlConnection: Pool;
  readonly model: new () => T;
  readonly tableName: string;

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
        const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(
          select.selectAll,
        );
        this.log(select.selectAll);
        return rows.map((row) =>
          MySqlUtils.convertSqlResultToModel(row, this.model),
        );
      }

      const query = ModelManagerQueryUtils.parseSelectQueryInput(
        this.tableName,
        input,
      );
      const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
      this.log(query);
      return rows.map((row) =>
        MySqlUtils.convertSqlResultToModel(row, this.model),
      );
    } catch (error) {
      this.queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  private log(query: string) {
    if (!this.logs) {
      return;
    }

    logger.info(query);
  }

  private queryError(error: any) {
    logger.error("Query Failed ", error);
  }
}
