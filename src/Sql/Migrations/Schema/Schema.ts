import dotenv from "dotenv";
import createTableTemplate from "../../Resources/Migration/CREATETABLE";
import ColumnBuilderConnector from "../Columns/CreateTable/ColumnBuilderConnector";
import dropTableTemplate from "../../Resources/Migration/DROPTABLE";
import ColumnBuilderAlter from "../Columns/AlterTable/ColumnBuilderAlter";
import { DataSourceType } from "../../../Datasource";

dotenv.config();

export default class Schema {
  public queryStatements: string[];
  public sqlType: DataSourceType;

  constructor(sqlType?: DataSourceType) {
    this.queryStatements = [];
    this.sqlType = (sqlType ||
      process.env.DB_TYPE ||
      "mysql") as DataSourceType;
  }

  public rawQuery(query: string): void {
    this.queryStatements.push(query);
  }

  public createTable(
    tableName: string,
    options?: { ifNotExists?: boolean },
  ): ColumnBuilderConnector {
    const partialQuery =
      options && options.ifNotExists
        ? createTableTemplate.createTableIfNotExists(tableName)
        : createTableTemplate.createTable(tableName);

    return new ColumnBuilderConnector(
      tableName,
      this.queryStatements,
      partialQuery,
      this.sqlType,
    );
  }

  public alterTable(tableName: string) {
    return new ColumnBuilderAlter(
      tableName,
      this.queryStatements,
      "",
      this.sqlType,
    );
  }

  public dropTable(tableName: string, ifExists: boolean = false): void {
    this.rawQuery(dropTableTemplate(tableName, ifExists));
  }

  public truncateTable(tableName: string): void {
    this.rawQuery(`TRUNCATE TABLE ${tableName}`);
  }
}
