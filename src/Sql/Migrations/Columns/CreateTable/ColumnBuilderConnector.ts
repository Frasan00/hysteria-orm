import ColumnTypeBuilder from "./ColumnTypeBuilder";

export default class ColumnBuilderConnector {
  protected tableName: string;
  protected queryStatements: string[];
  protected partialQuery: string;
  protected sqlType: "mysql" | "postgres";

  constructor(
    tableName: string,
    queryStatements: string[],
    partialQuery: string,
    sqlType: "mysql" | "postgres",
  ) {
    this.tableName = tableName;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
  }

  public newColumn(): ColumnTypeBuilder {
    return new ColumnTypeBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }
}
