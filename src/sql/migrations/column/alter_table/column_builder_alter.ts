import { DateTime } from "luxon";
import { SqlDataSourceType } from "../../../sql_data_source";
import ColumnTypeBuilder, {
  DateOptions,
} from "../create_table/column_type_builder";

type References = {
  table: string;
  column: string;
  onDelete?: string;
  onUpdate?: string;
};

type AlterOptions = {
  afterColumn?: string;
  references?: References;
};

type DataType =
  | "uuid"
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
  | "jsonb";

type BaseOptions = {
  afterColumn?: string;
  references?: References;
  precision?: number;
  scale?: number;
  default?: any;
  primaryKey?: boolean;
  unique?: boolean;
  notNullable?: boolean;
  autoIncrement?: boolean;
  length?: number;
};

export default class ColumnBuilderAlter {
  protected table: string;
  protected queryStatements: string[];
  protected sqlType: SqlDataSourceType;
  protected partialQuery: string;

  constructor(
    table: string,
    queryStatements: string[],
    partialQuery: string,
    sqlType: SqlDataSourceType,
  ) {
    this.table = table;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
  }

  /**
   * @description Add a new column to the table
   * @param columnName { string }
   * @param {DataType} dataType
   * @param {BaseOptions} options
   */
  public addColumn(
    columnName: string,
    dataType: DataType,
    options?: BaseOptions,
  ): ColumnBuilderAlter {
    let query = `ALTER TABLE ${this.table} ADD COLUMN `;
    const columnsBuilder = new ColumnTypeBuilder("", [], "", this.sqlType);
    switch (dataType) {
      case "uuid":
        columnsBuilder.uuid(columnName);
        break;
      case "varchar":
        columnsBuilder.varchar(columnName, options?.length);
        break;
      case "tinytext":
        columnsBuilder.tinytext(columnName);
        break;
      case "mediumtext":
        columnsBuilder.mediumtext(columnName);
        break;
      case "longtext":
        columnsBuilder.longtext(columnName);
        break;
      case "binary":
        columnsBuilder.binary(columnName, options?.length);
        break;
      case "text":
        columnsBuilder.text(columnName);
        break;
      case "char":
        columnsBuilder.char(columnName, options?.length);
        break;
      case "tinyint":
        columnsBuilder.tinyint(columnName);
        break;
      case "smallint":
        columnsBuilder.smallint(columnName);
        break;
      case "mediumint":
        columnsBuilder.mediumint(columnName);
        break;
      case "integer":
        columnsBuilder.integer(columnName, options?.length);
        break;
      case "bigint":
        columnsBuilder.bigint(columnName);
        break;
      case "float":
        const { precision: floatPrecision = 10, scale: floatScale = 2 } =
          options || {};
        columnsBuilder.float(columnName, {
          precision: floatPrecision,
          scale: floatScale,
        });
        break;
      case "decimal":
        const { precision = 10, scale = 2 } = options || {};
        columnsBuilder.decimal(columnName, {
          precision: precision,
          scale: scale,
        });
        break;
      case "double":
        const { precision: doublePrecision = 10, scale: doubleScale = 2 } =
          options || {};
        columnsBuilder.double(columnName, {
          precision: doublePrecision,
          scale: doubleScale,
        });
        break;
      case "boolean":
        columnsBuilder.boolean(columnName);
        break;
      case "jsonb":
        columnsBuilder.jsonb(columnName);
        break;
      default:
        throw new Error("Unsupported data type");
    }

    query += columnsBuilder.partialQuery;

    if (options?.default !== undefined) {
      if (typeof options.default === "string") {
        query += ` DEFAULT '${options.default}'`;
      } else if (options.default instanceof Date) {
        query += ` DEFAULT '${options.default.toISOString()}'`;
      } else if (options.default instanceof DateTime) {
        query += ` DEFAULT '${options.default.toISO()}'`;
      } else if (typeof options.default === "object") {
        query += ` DEFAULT '${JSON.stringify(options.default)}'`;
      } else if (typeof options.default === null) {
        query += " DEFAULT NULL";
      } else {
        query += ` DEFAULT ${options.default}`;
      }
    }

    if (options?.primaryKey) {
      query += " PRIMARY KEY";
    }

    if (options?.unique) {
      query += " UNIQUE";
    }

    if (options?.references) {
      query += ` REFERENCES ${options.references.table}(${
        options.references.column
      }) ON DELETE ${options.references.onDelete || "NO ACTION"} ON UPDATE ${
        options.references.onUpdate || "NO ACTION"
      }`;
    }

    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in ALTER COLUMN");
        case "sqlite":
          throw new Error("Sqlite does not support AFTER in ALTER COLUMN");
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
   * @description Add a new date column to the table
   * @param columnName { string }
   * @param options { DateOptions }
   */
  public addDateColumn(
    columnName: string,
    type: "date" | "timestamp",
    options?: DateOptions & {
      afterColumn?: string;
      notNullable?: boolean;
      default?: string | Date | DateTime;
    },
  ): ColumnBuilderAlter {
    let query = `ALTER TABLE ${this.table} ADD COLUMN ${columnName} ${type}`;
    if (options?.autoCreate) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += " DEFAULT CURRENT_TIMESTAMP";
          break;
        case "postgres":
          query += " DEFAULT CURRENT_TIMESTAMP";
          break;
        case "sqlite":
          query += " DEFAULT CURRENT_TIMESTAMP";
          break;
        default:
          throw new Error("Unsupported database type");
      }
    }

    if (options?.autoUpdate) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += " ON UPDATE CURRENT_TIMESTAMP";
          break;
        case "postgres":
          query += " ON UPDATE CURRENT_TIMESTAMP";
          break;
        case "sqlite":
          query += " ON UPDATE CURRENT_TIMESTAMP";
          break;
        default:
          throw new Error("Unsupported database type");
      }
    }

    if (options?.notNullable) {
      query += " NOT NULL";
    }

    if (options?.default !== undefined) {
      if (typeof options.default === "string") {
        query += ` DEFAULT '${options.default}'`;
      } else if (options.default instanceof Date) {
        query += ` DEFAULT '${options.default.toISOString()}'`;
      } else {
        query += ` DEFAULT '${options.default.toISO()}'`;
      }
    }

    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in ALTER COLUMN");
        case "sqlite":
          throw new Error("Sqlite does not support AFTER in ALTER COLUMN");
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
    options?: {
      afterColumn?: string;
      notNullable?: boolean;
      default?: string;
      unique?: boolean;
    },
  ): ColumnBuilderAlter {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        const parsedValues = values.map((value) => {
          if (typeof value === "number") {
            return value;
          } else if (typeof value === "boolean") {
            return value ? 1 : 0;
          } else if (typeof value === "string") {
            return `'${value}'`;
          }
        });
        this.partialQuery = `ALTER TABLE ${
          this.table
        } ADD COLUMN ${columnName} ENUM(${parsedValues.join(", ")})`;
        break;
      case "postgres":
        const enumTypeName = `${this.table}_${columnName}_enum`;
        const parsedValuesPg = values.map((value) => {
          if (typeof value === "number") {
            return value;
          } else if (typeof value === "boolean") {
            return value ? 1 : 0;
          } else if (typeof value === "string") {
            return `'${value}'`;
          }
        });
        this.partialQuery = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumTypeName}') THEN
    CREATE TYPE ${enumTypeName} AS ENUM(${parsedValuesPg.join(", ")});
  END IF;
END $$;
ALTER TABLE ${this.table} ADD COLUMN ${columnName} ${enumTypeName}
      `;
        break;
      case "sqlite":
        const parsedValuesSqlite = values.map((value) => {
          if (typeof value === "number") {
            return value;
          } else if (typeof value === "boolean") {
            return value ? 1 : 0;
          } else if (typeof value === "string") {
            return `'${value}'`;
          }
        });
        this.partialQuery = `ALTER TABLE ${
          this.table
        } ADD COLUMN ${columnName} TEXT ${
          options?.notNullable ? "NOT NULL" : ""
        } DEFAULT ${
          options?.default ? `'${options.default}'` : "NULL"
        } CHECK (${columnName} IN (${parsedValuesSqlite.join(", ")}))`;
        break;
      default:
        throw new Error("Unsupported database type");
    }

    if (options?.notNullable && this.sqlType !== "sqlite") {
      this.partialQuery += " NOT NULL";
    }

    if (options?.default && this.sqlType !== "sqlite") {
      this.partialQuery += ` DEFAULT '${options.default}'`;
    }

    if (options?.unique) {
      this.partialQuery += " UNIQUE";
    }

    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          this.partialQuery += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in AFTER COLUMN");
        case "sqlite":
          throw new Error("Sqlite does not support AFTER in AFTER COLUMN");
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
      case "sqlite":
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
        this.partialQuery = `ALTER TABLE ${this.table} CHANGE COLUMN ${oldColumnName} ${newColumnName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} RENAME COLUMN ${oldColumnName} TO ${newColumnName}`;
        break;
      case "sqlite":
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
    newDataType: string,
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
      case "sqlite":
        throw new Error("Sqlite does not support modifying column types");
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
      this.partialQuery += ` REFERENCES ${options.references.table}(${
        options.references.column
      }) ON DELETE ${options.references.onDelete || "NO ACTION"} ON UPDATE ${
        options.references.onUpdate || "NO ACTION"
      }`;
    }

    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          this.partialQuery += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in ALTER COLUMN");
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
      case "sqlite":
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
      case "sqlite":
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
      case "sqlite":
        throw new Error("Sqlite does not support dropping default values");
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
        this.partialQuery = `ALTER TABLE ${
          this.table
        } ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${
          options.references.table
        }(${options.references.column}) ON DELETE ${
          options.references.onDelete || "NO ACTION"
        } ON UPDATE ${options.references.onUpdate || "NO ACTION"}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${
          this.table
        } ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${
          options.references.table
        }(${options.references.column}) ON DELETE ${
          options.references.onDelete || "NO ACTION"
        } ON UPDATE ${options.references.onUpdate || "NO ACTION"}`;
        break;
      case "sqlite":
        this.partialQuery = `ALTER TABLE ${
          this.table
        } ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${
          options.references.table
        }(${options.references.column}) ON DELETE ${
          options.references.onDelete || "NO ACTION"
        } ON UPDATE ${options.references.onUpdate || "NO ACTION"}`;
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
      case "sqlite":
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