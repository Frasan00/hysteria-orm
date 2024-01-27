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
  | "json"
  | "jsonb";

export default class ColumnBuilderAlter {
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

  /**
   * @description Add a new column to the table
   * @param columnName { string }
   * @param dataType { varchar | tinytext | mediumtext | longtext | binary | text | char | tinyint | smallint | mediumint | integer | bigint | float | decimal | double | boolean | date | timestamp | json | jsonb }
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
        default:
          query += ` ${dataType}`;
      }
    }

    if (options?.notNullable) {
      query += " NOT NULL";
    }

    if (options?.autoIncrement) {
      if (this.sqlType === "mysql") {
        query += " AUTO_INCREMENT";
      } else {
        query += " SERIAL";
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

    if (this.sqlType === "mysql" && options?.afterColumn) {
      query += ` AFTER ${options.afterColumn}`;
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
    this.partialQuery = `ALTER TABLE ${this.tableName} ADD COLUMN ${columnName} ENUM(${values
      .map((value) => `'${value}'`)
      .join(",")})`;

    if (options?.notNullable) {
      this.partialQuery += " NOT NULL";
    }

    if (options?.afterColumn) {
      this.partialQuery += ` AFTER ${options.afterColumn}`;
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
    this.partialQuery = `ALTER TABLE ${this.tableName} DROP COLUMN ${columnName}`;

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
    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} CHANGE ${oldColumnName} ${newColumnName}`;
    } else {
      this.partialQuery = `ALTER TABLE ${this.tableName} RENAME COLUMN ${oldColumnName} TO ${newColumnName}`;
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }


  public modifyColumnType(
    columnName: string,
    newDataType: DataType,
    length?: number
  ): ColumnBuilderAlter {
    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} MODIFY COLUMN ${columnName} ${newDataType}(${length})`;
    } else {
      this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} TYPE ${newDataType}(${length})`;
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
    if (this.sqlType === "mysql") {
      this.partialQuery = `RENAME TABLE ${oldTableName} TO ${newTableName}`;
    } else {
      this.partialQuery = `ALTER TABLE ${oldTableName} RENAME TO ${newTableName}`;
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
    this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} SET DEFAULT ${defaultValue}`;

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Drop a default value
   * @param columnName
   */
  public dropDefaultValue(columnName: string): ColumnBuilderAlter {
    this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} DROP DEFAULT`;

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
    const referencesSQL = `REFERENCES ${options.references.table}(${options.references.column})`;

    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) ${referencesSQL}`;
    } else {
      this.partialQuery = `ALTER TABLE ${this.tableName} ADD FOREIGN KEY (${columnName}) ${referencesSQL}`;
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
    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} DROP FOREIGN KEY ${columnName}`;
    } else {
      this.partialQuery = `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS ${this.tableName}_${columnName}_fk`;
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Add a primary key
   * @param columnNames
   */
  public addPrimaryKey(columnNames: string[]): ColumnBuilderAlter {
    const pkName = `${this.tableName}_pk`;
    this.partialQuery = `ALTER TABLE ${
      this.tableName
    } ADD CONSTRAINT ${pkName} PRIMARY KEY (${columnNames.join(", ")})`;

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Drop a primary key
   */
  public dropPrimaryKey(): ColumnBuilderAlter {
    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} DROP PRIMARY KEY`;
    } else {
      const pkName = `${this.tableName}_pkey`;
      this.partialQuery = `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${pkName}`;
    }

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Add a check constraint - EXPERIMENTAL
   * @param condition
   * @param constraintName
   */
  public addCheckConstraint(
    condition: string,
    constraintName?: string,
  ): ColumnBuilderAlter {
    const ckName = constraintName || `${this.tableName}_ck`;
    this.partialQuery = `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${ckName} CHECK (${condition})`;

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description drop a check constraint - EXPERIMENTAL
   * @param constraintName
   */
  public dropCheckConstraint(constraintName: string): ColumnBuilderAlter {
    this.partialQuery = `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${constraintName}`;

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Add a unique constraint - EXPERIMENTAL
   * @param columnNames
   * @param constraintName
   */
  public addUniqueConstraint(
    columnNames: string[],
    constraintName?: string,
  ): ColumnBuilderAlter {
    const uqName =
      constraintName || `${this.tableName}_uq_${columnNames.join("_")}`;
    this.partialQuery = `ALTER TABLE ${
      this.tableName
    } ADD CONSTRAINT ${uqName} UNIQUE (${columnNames.join(", ")})`;

    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }

  /**
   * @description Drop a unique constraint - EXPERIMENTAL
   * @param constraintName
   */
  public dropUniqueConstraint(constraintName: string): ColumnBuilderAlter {
    this.partialQuery = `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${constraintName}`;

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
