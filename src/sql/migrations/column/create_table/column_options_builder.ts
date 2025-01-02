import { SqlDataSourceType } from "../../../sql_data_source_types";
import { ColumnBuilder } from "./column_builder";
import ColumnTypeBuilder from "./column_type_builder";

// TODO: remove the other props from the class
export default class ColumnOptionsBuilder extends ColumnBuilder {
  protected columnTypeBuilder: ColumnTypeBuilder;

  constructor(
    columnTypeBuilder: ColumnTypeBuilder,
  ) {
    super(
      columnTypeBuilder.table,
      columnTypeBuilder.queryStatements,
      columnTypeBuilder.partialQuery,
      columnTypeBuilder.sqlType,
      columnTypeBuilder.columnName,
      columnTypeBuilder.columnReferences,
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
    );
  }

  default(value: string | number | boolean): ColumnOptionsBuilder {
    this.columnTypeBuilder.partialQuery += ` DEFAULT ${value},`;
    return new ColumnOptionsBuilder(
      this.columnTypeBuilder,
    );
  }

  /**
   * @description Makes the column unsigned allowing only positive values
   */
  unsigned(): ColumnOptionsBuilder {
    this.columnTypeBuilder.partialQuery += " UNSIGNED";
    return new ColumnOptionsBuilder(
      this.columnTypeBuilder,
    );
  }

  /**
   * @description Makes the column not nullable
   */
  notNullable(): ColumnOptionsBuilder {
    this.columnTypeBuilder.partialQuery += " NOT NULL";
    return new ColumnOptionsBuilder(
      this.columnTypeBuilder,
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
        );

      case "postgres":
        this.columnTypeBuilder.partialQuery += " PRIMARY KEY";
        return new ColumnOptionsBuilder(
          this.columnTypeBuilder,
        );

      case "sqlite":
        this.columnTypeBuilder.partialQuery += " PRIMARY KEY";
        return new ColumnOptionsBuilder(
          this.columnTypeBuilder,
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
    this.columnTypeBuilder.columnReferences?.push({
      table,
      column,
      onDelete: options?.onDelete,
      onUpdate: options?.onUpdate,
    });

    return new ColumnOptionsBuilder(
      this.columnTypeBuilder,
    );
  }
}
