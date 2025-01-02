import { SqlDataSourceType } from "../../../sql_data_source_types";
import { ColumnBuilder } from "./column_builder";
import ColumnTypeBuilder from "./column_type_builder";

// TODO: remove the other props from the class
export default class ColumnOptionsBuilder extends ColumnBuilder {
  protected columnTypeBuilder: ColumnTypeBuilder;

  constructor(
    columnTypeBuilder: ColumnTypeBuilder,
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
    super(
      table,
      queryStatements,
      partialQuery,
      sqlType,
      columnName,
      columnReferences,
    );
    this.columnTypeBuilder = columnTypeBuilder;
  }

  /**
   * @description Makes the column nullable
   */
  nullable(): ColumnOptionsBuilder {
    this.columnTypeBuilder.partialQuery += " NULL";
    return new ColumnOptionsBuilder(
      this.columnTypeBuilder,
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences,
    );
  }

  default(value: string | number | boolean): ColumnOptionsBuilder {
    this.columnTypeBuilder.partialQuery += ` DEFAULT ${value},`;
    return new ColumnOptionsBuilder(
      this.columnTypeBuilder,
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
  unsigned(): ColumnOptionsBuilder {
    this.columnTypeBuilder.partialQuery += " UNSIGNED";
    return new ColumnOptionsBuilder(
      this.columnTypeBuilder,
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
  notNullable(): ColumnOptionsBuilder {
    this.columnTypeBuilder.partialQuery += " NOT NULL";
    return new ColumnOptionsBuilder(
      this.columnTypeBuilder,
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
  primary(): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.columnTypeBuilder.partialQuery += " PRIMARY KEY";
        return new ColumnOptionsBuilder(
          this.columnTypeBuilder,
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
          this.columnReferences,
        );

      case "postgres":
        this.columnTypeBuilder.partialQuery += " PRIMARY KEY";
        return new ColumnOptionsBuilder(
          this.columnTypeBuilder,
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
          this.columnReferences,
        );

      case "sqlite":
        this.columnTypeBuilder.partialQuery += " PRIMARY KEY";
        return new ColumnOptionsBuilder(
          this.columnTypeBuilder,
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
  unique(): ColumnOptionsBuilder {
    this.columnTypeBuilder.partialQuery += " UNIQUE";
    return new ColumnOptionsBuilder(
      this.columnTypeBuilder,
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
  autoIncrement(): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.columnTypeBuilder.partialQuery += " AUTO_INCREMENT";
        return new ColumnOptionsBuilder(
          this.columnTypeBuilder,
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
  references(
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
      this.columnTypeBuilder,
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences,
    );
  }
}
