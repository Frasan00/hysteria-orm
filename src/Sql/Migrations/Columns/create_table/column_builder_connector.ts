import { SqlDataSourceType } from "../../../../datasource";
import Column_type_builder from "./column_type_builder";

export default class Column_builder_connector {
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

  public newColumn(): Column_type_builder {
    return new Column_type_builder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }
}
