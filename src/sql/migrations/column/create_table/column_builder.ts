import type { SqlDataSourceType } from "../../../sql_data_source_types";

export abstract class ColumnBuilder {
  partialQuery: string;
  protected afterDefinitionQueries: string[];
  protected table: string;
  protected queryStatements: string[];
  protected columnName: string;
  protected sqlType: SqlDataSourceType;
  protected columnReferences: {
    localColumn: string;
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  }[];

  constructor(
    table: string,
    queryStatements: string[],
    afterDefinitionQueries: string[],
    partialQuery: string,
    sqlType: SqlDataSourceType,
    columnName: string = "",
    columnReferences: {
      localColumn: string;
      table: string;
      column: string;
      onDelete?: string;
      onUpdate?: string;
    }[] = [],
  ) {
    this.table = table;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
    this.columnName = columnName;
    this.columnReferences = columnReferences;
    this.afterDefinitionQueries = afterDefinitionQueries;
  }

  /**
   * @description Not to be used directly. This method is used to commit the column to the query statements.
   * @internal
   */
  commit(): void {
    if (this.columnReferences.length) {
      this.columnReferences.forEach((reference) => {
        const uniqueId = Math.floor(10000000 + Math.random() * 90000000);
        switch (this.sqlType) {
          case "mysql":
          case "mariadb":
            this.partialQuery += `,\n\tCONSTRAINT fk_${uniqueId}_${reference.localColumn} FOREIGN KEY (${reference.localColumn}) REFERENCES ${reference.table}(${reference.column})`;
            break;
          case "postgres":
            this.partialQuery += `,\n\tCONSTRAINT fk_${uniqueId}_${reference.localColumn} FOREIGN KEY (${reference.localColumn}) REFERENCES ${reference.table}(${reference.column})`;
            break;
          case "sqlite":
            this.partialQuery += `,\n\tCONSTRAINT fk_${uniqueId}_${reference.localColumn} FOREIGN KEY (${reference.localColumn}) REFERENCES ${reference.table}(${reference.column})`;
            break;
          default:
            break;
        }
      });
    }

    this.partialQuery += "\n";
    this.partialQuery += ");";
    this.queryStatements.push(this.partialQuery);
    this.queryStatements.push(...this.afterDefinitionQueries);
  }
}
