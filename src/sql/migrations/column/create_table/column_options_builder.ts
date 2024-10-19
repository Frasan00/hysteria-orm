import { SqlDataSourceType } from "../../../sql_data_source";
import ColumnTypeBuilder from "./column_type_builder";

export default class ColumnOptionsBuilder {
  protected table: string;
  protected queryStatements: string[];
  protected partialQuery: string;
  protected columnName: string;
  protected columnReferences: {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  }[];
  protected sqlType: SqlDataSourceType;

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
   * @description Makes the column nullable
   */
  public nullable(): ColumnOptionsBuilder {
    this.partialQuery += " NULL";
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences,
    );
  }

  public default(value: string | number | boolean): ColumnOptionsBuilder {
    this.partialQuery += ` DEFAULT ${value}`;
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences,
    );
  }

  /**
   * @description Makes the column unsigned allowing only positive values
   */
  public unsigned(): ColumnOptionsBuilder {
    this.partialQuery += " UNSIGNED";
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences,
    );
  }

  /**
   * @description Makes the column not nullable
   */
  public notNullable(): ColumnOptionsBuilder {
    this.partialQuery += " NOT NULL";
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences,
    );
  }

  /**
   * @description Makes the column the primary key
   */
  public primary(): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.partialQuery += " PRIMARY KEY";
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
          this.columnReferences,
        );

      case "postgres":
        this.partialQuery += " PRIMARY KEY";
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
          this.columnReferences,
        );

      case "sqlite":
        this.partialQuery += " PRIMARY KEY";
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
          this.columnReferences,
        );

      default:
        throw new Error("Unsupported SQL type");
    }
  }

  /**
   * @description Adds an unique constraint
   */
  public unique(): ColumnOptionsBuilder {
    this.partialQuery += " UNIQUE";
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences,
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
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
        );

      case "postgres":
        throw new Error("Auto Increment not supported for PostgreSQL");
      case "sqlite":
        throw new Error("Auto Increment not supported for sqlite");
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  /**
   * @description Adds a foreign key with a specific constraint
   * @param table
   * @param column
   */
  public references(
    table: string,
    column: string,
    options?: { onDelete: string; onUpdate: string },
  ): ColumnOptionsBuilder {
    this.columnReferences?.push({
      table,
      column,
      onDelete: options?.onDelete,
      onUpdate: options?.onUpdate,
    });
    return new ColumnOptionsBuilder(
      this.table,
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
    return new ColumnTypeBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
    );
  }

  /**
   * @description Commits the column creation - if omitted, the migration will be run empty
   */
  public commit(): void {
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
