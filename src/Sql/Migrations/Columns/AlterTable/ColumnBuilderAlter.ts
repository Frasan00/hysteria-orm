import { DataSourceType } from "../../../../Datasource";

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

export default class ColumnBuilderAlter {
  protected tableName: string;
  protected queryStatements: string[];
  protected partialQuery: string;
  protected sqlType: DataSourceType;

  constructor(
    tableName: string,
    queryStatements: string[],
    partialQuery: string,
    sqlType: DataSourceType,
  ) {
    this.tableName = tableName;
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
    options?: {
      afterColumn?: string;
      references?: { table: string; column: string };
      default?: string;
      primaryKey?: boolean;
      unique?: boolean;
      notNullable?: boolean;
      autoIncrement?: boolean;
      length?: number;
    },
  ): ColumnBuilderAlter {
    let query = `ALTER TABLE ${this.tableName} ADD COLUMN ${columnName}`;

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
          query += ` AFTER ${options.afterColumn}`;
          break;
        default:
          throw new Error("Unsupported database type");
      }
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
          this.tableName
        } ADD COLUMN ${columnName} ENUM('${values.join("', '")}')`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.tableName} ADD COLUMN ${columnName} ${values[0]}`;
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
        this.partialQuery = `ALTER TABLE ${this.tableName} DROP COLUMN ${columnName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.tableName} DROP COLUMN ${columnName}`;
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
        this.partialQuery = `ALTER TABLE ${this.tableName} CHANGE ${oldColumnName} ${newColumnName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.tableName} RENAME COLUMN ${oldColumnName} TO ${newColumnName}`;
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
    length?: number,
  ): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${
          this.tableName
        } MODIFY COLUMN ${columnName} ${newDataType}${
          length ? `(${length})` : ""
        }`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${
          this.tableName
        } ALTER COLUMN ${columnName} TYPE ${newDataType}${
          length ? `(${length})` : ""
        }`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Renames a table
   * @param oldTableName
   * @param newTableName
   */
  public renameTable(
    oldTableName: string,
    newTableName: string,
  ): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `RENAME TABLE ${oldTableName} TO ${newTableName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${oldTableName} RENAME TO ${newTableName}`;
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
        this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} SET DEFAULT ${defaultValue}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} SET DEFAULT ${defaultValue}`;
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
        this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} DROP DEFAULT`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} DROP DEFAULT`;
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

    const fkName = `${this.tableName}_${columnName}_fk`;
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${options.references.table}(${options.references.column})`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${options.references.table}(${options.references.column})`;
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
    const fkName = `${this.tableName}_${columnName}_fk`;
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.tableName} DROP FOREIGN KEY ${fkName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${fkName}`;
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
