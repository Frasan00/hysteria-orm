import { SqlDataSourceType } from "../../../sql_data_source_types";

export abstract class ColumnBuilder {
  table: string;
  queryStatements: string[];
  columnName: string;
  sqlType: SqlDataSourceType;
  partialQuery: string;
  columnReferences: {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  }[];

  constructor(
    table: string,
    queryStatements: string[],
    partialQuery: string,
    sqlType: SqlDataSourceType,
    columnName: string = "",
    columnReferences: {
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
  }

  /**
   * @internal
   */
  commit(): void {
    if (this.columnReferences.length) {
      this.columnReferences.forEach((reference) => {
        switch (this.sqlType) {
          case "mysql":
          case "mariadb":
            this.partialQuery += `,\nCONSTRAINT fk_${this.table}_${
              this.columnName
            } FOREIGN KEY (${this.columnName}) REFERENCES ${reference.table}(${
              reference.column
            }) ${reference.onDelete ? `ON DELETE ${reference.onDelete}` : ""} ${
              reference.onUpdate ? `ON UPDATE ${reference.onUpdate}` : ""
            }`;
            break;
          case "postgres":
            this.partialQuery += `,\nCONSTRAINT fk_${this.table}_${
              this.columnName
            } FOREIGN KEY (${this.columnName}) REFERENCES ${reference.table}(${
              reference.column
            }) ${reference.onDelete ? `ON DELETE ${reference.onDelete}` : ""} ${
              reference.onUpdate ? `ON UPDATE ${reference.onUpdate}` : ""
            }`;
            break;
          case "sqlite":
            this.partialQuery += `,\nFOREIGN KEY (${
              this.columnName
            }) REFERENCES ${reference.table}(${reference.column}) ${
              reference.onDelete ? `ON DELETE ${reference.onDelete}` : ""
            } ${reference.onUpdate ? `ON UPDATE ${reference.onUpdate}` : ""}`;
            break;
          default:
            throw new Error("Unsupported SQL type");
        }
      });
    }

    this.partialQuery += "\n";
    this.partialQuery += ");";
    this.queryStatements.push(this.partialQuery);
  }
}
