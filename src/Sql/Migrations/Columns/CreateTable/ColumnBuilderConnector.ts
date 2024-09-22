import { SqlDataSourceType } from "../../../../Datasource";
import ColumnTypeBuilder from "./ColumnTypeBuilder";

export default class ColumnBuilderConnector {
  protected table: string;
  protected queryStatements: string[];
  protected partialQuery: string;
  protected sqlType: SqlDataSourceType;

  constructor(
    table: string,
    queryStatements: string[],
    partialQuery: string,
    sqlType: SqlDataSourceType,
  ) {
    this.table = table;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
  }

  public newColumn(): ColumnTypeBuilder {
    return new ColumnTypeBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }
}
