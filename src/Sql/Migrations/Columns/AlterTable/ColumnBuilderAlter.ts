import { DataSourceType } from "../../../../Datasource";
import { DateOptions } from "../CreateTable/ColumnTypeBuilder";

type AlterOptions = {
  afterColumn?: string;
  references?: {
    table: string;
    column: string;
  };
};

type DataType =
  | "varchar"
  | "tinytext"
  | "mediumtext"
  | "longtext"
  | "binary"
  | "text"
  | "char"
  | "tinyint"
  | "smallint"
  | "mediumint"
  | "integer"
  | "bigint"
  | "float"
  | "decimal"
  | "double"
  | "boolean"
  | "date"
  | "timestamp"
  | "jsonb";

type BaseOptions = {
  afterColumn?: string;
  references?: { table: string; column: string };
  default?: string;
  primaryKey?: boolean;
  unique?: boolean;
  notNullable?: boolean;
  autoIncrement?: boolean;
  length?: number;
} & DateOptions;

export default class ColumnBuilderAlter {
  protected table: string;
  protected queryStatements: string[];
  protected partialQuery: string;
  protected sqlType: DataSourceType;

  constructor(
    table: string,
    queryStatements: string[],
    partialQuery: string,
    sqlType: DataSourceType,
  ) {
    this.table = table;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
  }

  /**
   * @description Add a new column to the table
   * @param columnName { string }
   * @param dataType { varchar | tinytext | mediumtext | longtext | binary | text | char | tinyint | smallint | mediumint | integer | bigint | float | decimal | double | boolean | date | timestamp | jsonb }
   * @param options { afterColumn?: string; references?: { table: string; column: string }; default?: string; primaryKey?: boolean; unique?: boolean; notNullable?: boolean; autoIncrement?: boolean; length?: number; }
   */
  public addColumn(
    columnName: string,
    dataType: DataType,
    options?: BaseOptions,
  ): ColumnBuilderAlter {
    let query = `ALTER TABLE ${this.table} ADD COLUMN ${columnName}`;

    if (options?.length) {
      query += ` ${dataType}(${options.length})`;
    } else {
      switch (dataType) {
        case "varchar":
          query += " varchar(255)";
          break;
        case "char":
          query += " char(1)";
          break;
        case "binary":
          query += " binary()";
          break;
        case "jsonb":
          switch (this.sqlType) {
            case "mariadb":
            case "mysql":
              query += " json";
              break;
            case "postgres":
              query += " jsonb";
              break;
            default:
              throw new Error("Unsupported database type");
          }
          break;
        default:
          query += ` ${dataType}`;
      }
    }

    if (options?.notNullable) {
      query += " NOT NULL";
    }

    if (options?.autoIncrement) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += " AUTO_INCREMENT";
          break;
        case "postgres":
          query += " SERIAL";
          break;
        default:
          throw new Error("Unsupported database type");
      }
    }

    if (options?.default !== undefined) {
      query += ` DEFAULT ${options.default}`;
    }

    if (options?.primaryKey) {
      query += " PRIMARY KEY";
    }

    if (options?.unique) {
      query += " UNIQUE";
    }

    if (options?.references) {
      query += ` REFERENCES ${options.references.table}(${options.references.column})`;
    }

    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in ALTER COLUMN");
        default:
          throw new Error("Unsupported database type");
      }
    }

    if (
      options &&
      (dataType === "date" || dataType) === "timestamp" &&
      Object.hasOwnProperty.call(options, "autoCreate")
    ) {
      this.partialQuery += " DEFAULT CURRENT_DATE";
    }

    if (
      options &&
      (dataType === "date" || dataType) === "timestamp" &&
      Object.hasOwnProperty.call(options, "autoUpdate")
    ) {
      if (this.sqlType === "postgres") {
        throw new Error("Postgres does not support ON UPDATE CURRENT_DATE");
      }

      this.partialQuery += " ON UPDATE CURRENT_DATE";
    }

    this.partialQuery = query;
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Add a new enum column to the table
   * @param columnName { string }
   * @param values { string[] }
   * @param options { afterColumn?: string; notNullable?: boolean }
   */
  public addEnumColumn(
    columnName: string,
    values: string[],
    options?: { afterColumn?: string; notNullable?: boolean },
  ): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${
          this.table
        } ADD COLUMN ${columnName} ENUM('${values.join("', '")}')`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} ADD COLUMN ${columnName} ${values[0]}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    if (options?.notNullable) {
      this.partialQuery += " NOT NULL";
    }

    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          this.partialQuery += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          this.partialQuery += ` AFTER ${options.afterColumn}`;
          break;
        default:
          throw new Error("Unsupported database type");
      }
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Drops a column from the table
   * @param columnName
   */
  public dropColumn(columnName: string): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} DROP COLUMN ${columnName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} DROP COLUMN ${columnName}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Renames a column
   * @param oldColumnName
   * @param newColumnName
   */
  public renameColumn(
    oldColumnName: string,
    newColumnName: string,
  ): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} CHANGE ${oldColumnName} ${newColumnName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} RENAME COLUMN ${oldColumnName} TO ${newColumnName}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  public modifyColumnType(
    columnName: string,
    newDataType: DataType,
    options?: BaseOptions,
  ): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${
          this.table
        } MODIFY COLUMN ${columnName} ${newDataType}${
          options && options.length ? `(${options.length})` : ""
        }`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${
          this.table
        } ALTER COLUMN ${columnName} TYPE ${newDataType}${
          options && options.length ? `(${options.length})` : ""
        }`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    if (options?.notNullable) {
      this.partialQuery += " NOT NULL";
    }

    if (options?.default !== undefined) {
      this.partialQuery += ` DEFAULT ${options.default}`;
    }

    if (options?.primaryKey) {
      this.partialQuery += " PRIMARY KEY";
    }

    if (options?.unique) {
      this.partialQuery += " UNIQUE";
    }

    if (options?.references) {
      this.partialQuery += ` REFERENCES ${options.references.table}(${options.references.column})`;
    }

    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          this.partialQuery += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in ALTER COLUMN");
          break;
        default:
          throw new Error("Unsupported database type");
      }
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Renames a table
   * @param oldtable
   * @param newtable
   */
  public renameTable(oldtable: string, newtable: string): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `RENAME TABLE ${oldtable} TO ${newtable}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${oldtable} RENAME TO ${newtable}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Set a default value
   * @param columnName
   * @param defaultValue
   */
  public setDefaultValue(
    columnName: string,
    defaultValue: string,
  ): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} SET DEFAULT ${defaultValue}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} SET DEFAULT ${defaultValue}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Drop a default value
   * @param columnName
   */
  public dropDefaultValue(columnName: string): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} DROP DEFAULT`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} DROP DEFAULT`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Add a foreign key
   * @param columnName
   * @param options
   */
  public addForeignKey(
    columnName: string,
    options: AlterOptions,
  ): ColumnBuilderAlter {
    if (!options.references) {
      throw new Error(
        "References option must be provided to add a foreign key",
      );
    }

    const fkName = `${this.table}_${columnName}_fk`;
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${options.references.table}(${options.references.column})`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${options.references.table}(${options.references.column})`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Drop a foreign key
   * @param columnName
   */
  public dropForeignKey(columnName: string): ColumnBuilderAlter {
    const fkName = `${this.table}_${columnName}_fk`;
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} DROP FOREIGN KEY ${fkName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} DROP CONSTRAINT ${fkName}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Commits the changes - if omitted, the migration will be run empty
   */
  public commit(): void {
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
  }
}
