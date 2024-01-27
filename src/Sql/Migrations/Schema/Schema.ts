import dotenv from "dotenv";
import createTableTemplate from "../../Templates/Migration/CREATETABLE";
import ColumnBuilderConnector from "../Columns/CreateTable/ColumnBuilderConnector";
import dropTableTemplate from "../../Templates/Migration/DROPTABLE";
import ColumnBuilderAlter from "../Columns/AlterTable/ColumnBuilderAlter";

dotenv.config();

export default class Schema {
  public queryStatements: string[];
  public sqlType: "mysql" | "postgres";

  constructor(sqlType?: "mysql" | "postgres") {
    this.queryStatements = [];
    const dbVendor = process.env.DATABASE_TYPE as
      | "mysql"
      | "postgres"
      | undefined;
    this.sqlType = dbVendor || sqlType || "mysql";
  }

  public rawQuery(query: string): void {
    this.queryStatements.push(query);
  }

  public createTable(
    tableName: string,
    options: { ifNotExists?: boolean },
  ): ColumnBuilderConnector {
    const partialQuery = options.ifNotExists
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
