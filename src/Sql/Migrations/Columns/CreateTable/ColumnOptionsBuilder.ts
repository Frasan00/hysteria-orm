import { DataSourceType } from "../../../../Datasource";
import ColumnTypeBuilder from "./ColumnTypeBuilder";

export default class ColumnOptionsBuilder {
  protected tableName: string;
  protected queryStatements: string[];
  protected partialQuery: string;
  protected columnName: string;
  protected columnReferences?: {
    table: string;
    column: string;
  };
  protected sqlType: DataSourceType;

  constructor(
    tableName: string,
    queryStatements: string[],
    partialQuery: string,
    sqlType: DataSourceType,
    columnName: string = "",
    columnReferences?: {
      table: string;
      column: string;
    },
  ) {
    this.tableName = tableName;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
    this.columnName = columnName;
    this.columnReferences = columnReferences;
  }

  /**
   * @description Makes the column nullable
   */
  public nullable(): ColumnOptionsBuilder {
    this.partialQuery += " NULL";
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }

  public default(value: string | number | boolean): ColumnOptionsBuilder {
    this.partialQuery += ` DEFAULT ${value}`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  /**
   * @description Makes the column unsigned allowing only positive values
   */
  public unsigned(): ColumnOptionsBuilder {
    this.partialQuery += " UNSIGNED";
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }

  /**
   * @description Makes the column not nullable
   */
  public notNullable(): ColumnOptionsBuilder {
    this.partialQuery += " NOT NULL";
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }

  /**
   * @description Makes the column the primary key
   */
  public primary(): ColumnOptionsBuilder {
    this.partialQuery += " PRIMARY KEY";
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }

  /**
   * @description Adds an unique constraint
   */
  public unique(): ColumnOptionsBuilder {
    this.partialQuery += " UNIQUE";
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }

  /**
   * @description Adds an auto increment - only for mysql
   */
  public autoIncrement(): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.partialQuery += " AUTO_INCREMENT";
        return new ColumnOptionsBuilder(
          this.tableName,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
        );

      case "postgres":
        throw new Error("Auto Increment not supported for PostgreSQL");

      default:
        throw new Error("Unsupported SQL type");
    }
  }

  /**
   * @description Adds a foreign key with a specific constraint
   * @param table
   * @param column
   */
  public references(table: string, column: string): ColumnOptionsBuilder {
    this.columnReferences = { table, column };
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences,
    );
  }

  /**
   * @description Chains a new column creation
   */
  public newColumn(): ColumnTypeBuilder {
    this.partialQuery += ",\n";
    if (this.columnReferences) {
      this.partialQuery += `CONSTRAINT ${this.tableName}_${this.columnName}_${this.columnReferences.table}_${this.columnReferences.column}_fk FOREIGN KEY (${this.columnName}) REFERENCES ${this.columnReferences.table} (${this.columnReferences.column}),\n`;
    }

    return new ColumnTypeBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }

  /**
   * @description Commits the column creation - if omitted, the migration will be run empty
   */
  public commit(): void {
    if (this.columnReferences) {
      this.partialQuery += ",\n";
      this.partialQuery += `CONSTRAINT ${this.columnName}_fk FOREIGN KEY (${this.columnName}) REFERENCES ${this.columnReferences.table} (${this.columnReferences.column}),\n`;
    }
    this.partialQuery += "\n";

    this.partialQuery += ");";
    this.queryStatements.push(this.partialQuery);
  }
}
