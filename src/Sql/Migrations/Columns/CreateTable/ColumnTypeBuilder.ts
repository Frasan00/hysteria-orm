import { DataSourceType } from "../../../../Datasource";
import ColumnOptionsBuilder from "./ColumnOptionsBuilder";

export type DateOptions = {
  autoCreate?: boolean;
  autoUpdate?: boolean;
};

export default class ColumnTypeBuilder {
  protected tableName: string;
  protected queryStatements: string[];
  protected partialQuery: string;
  protected columnName: string;
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
    this.columnName = "";
  }

  public varchar(name: string, length: number): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} VARCHAR(${length})`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public tinytext(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} TINYTEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public mediumtext(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} MEDIUMTEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public longtext(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} LONGTEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public binary(name: string, length: number): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} BINARY(${length})`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public enum(name: string, values: string[]): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} ENUM("${values.join('","')}")`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public text(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} TEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public char(name: string, length: number): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} CHAR(${length})`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public tinyint(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} TINYINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public smallint(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} SMALLINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public mediumint(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} MEDIUMINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  /**
   * @description If using mysql, it will automatically add INT AUTO_INCREMENT
   * @param name
   */
  public serial(name: string): ColumnOptionsBuilder {
    if (this.sqlType === `mysql`) {
      this.columnName = name;
      this.partialQuery += `${name} INT AUTO_INCREMENT`;
      return new ColumnOptionsBuilder(
        this.tableName,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

    this.columnName = name;
    this.partialQuery += `${name} SERIAL`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  /**
   * @description If using mysql, it will automatically add BIGINT AUTO_INCREMENT
   * @param name
   */
  public bigSerial(name: string): ColumnOptionsBuilder {
    if (this.sqlType === `mysql`) {
      this.columnName = name;
      this.partialQuery += `${name} BIGINT AUTO_INCREMENT`;
      return new ColumnOptionsBuilder(
        this.tableName,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

    this.columnName = name;
    this.partialQuery += `${name} BIGSERIAL`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public integer(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} INT`;

    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public bigint(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} BIGINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public float(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} FLOAT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public decimal(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} DECIMAL`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public double(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} DOUBLE`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public boolean(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} BOOLEAN`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public date(name: string, options?: DateOptions): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} DATE`;

    if (options && options.autoCreate) {
      this.partialQuery += " DEFAULT CURRENT_DATE";
    }

    if (options && options.autoUpdate) {
      if (this.sqlType === "postgres") {
        throw new Error("Postgres does not support ON UPDATE CURRENT_DATE");
      }

      this.partialQuery += " ON UPDATE CURRENT_DATE";
    }

    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public timestamp(name: string, options?: DateOptions): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} TIMESTAMP`;
    if (options && options.autoCreate) {
      this.partialQuery += " DEFAULT CURRENT_TIMESTAMP";
    }

    if (options && options.autoUpdate) {
      if (this.sqlType === "postgres") {
        throw new Error("Postgres does not support ON UPDATE CURRENT_DATE");
      }

      this.partialQuery += " ON UPDATE CURRENT_TIMESTAMP";
    }

    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  /**
   * @description EXPERIMENTAL
   * @param name
   */
  public jsonb(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    switch (this.sqlType) {
      case "postgres":
        this.partialQuery += `${name} JSONB`;
        break;
      case "mariadb":
      case "mysql":
        this.partialQuery += `${name} JSON`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }
}
