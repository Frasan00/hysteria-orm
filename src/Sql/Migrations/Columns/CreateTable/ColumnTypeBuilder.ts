import { SqlDataSourceType } from "../../../../Datasource";
import ColumnOptionsBuilder from "./ColumnOptionsBuilder";

export type DateOptions = {
  autoCreate?: boolean;
  autoUpdate?: boolean;
};

export default class ColumnTypeBuilder {
  protected table: string;
  protected queryStatements: string[];
  protected columnName: string;
  protected sqlType: SqlDataSourceType;
  public partialQuery: string;

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
    this.columnName = "";
  }

  public varchar(name: string, length: number = 255): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} VARCHAR(${length})`;
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public uuid(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} UUID`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(36)`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public tinytext(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TINYTEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public mediumtext(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMTEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public longtext(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} LONGTEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public binary(name: string, length: number = 255): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BINARY(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BYTEA`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public enum(name: string, values: string[]): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} ENUM('${values.join("', '")}')`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        throw new Error("Postgres does not support ENUM as a column type");
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public text(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public char(name: string, length: number = 255): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public tinyint(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TINYINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public smallint(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public mediumint(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  /**
   * @description If using mysql, it will automatically add INT AUTO_INCREMENT
   * @param name
   */
  public serial(name: string): ColumnOptionsBuilder {
    if (this.sqlType === `mysql` || this.sqlType === `mariadb`) {
      this.columnName = name;
      this.partialQuery += `${name} INT AUTO_INCREMENT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

    this.columnName = name;
    this.partialQuery += `${name} SERIAL`;
    return new ColumnOptionsBuilder(
      this.table,
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
    if (this.sqlType === `mysql` || this.sqlType === `mariadb`) {
      this.columnName = name;
      this.partialQuery += `${name} BIGINT AUTO_INCREMENT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

    this.columnName = name;
    this.partialQuery += `${name} BIGSERIAL`;
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public integer(name: string, length?: number): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} INT ${length ? `(${length})` : ""}`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER ${length ? `(${length})` : ""}`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public bigInteger(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  /**
   * @description Alias for integer
   * @param name
   * @returns ColumnOptionsBuilder
   */
  public int(name: string): ColumnOptionsBuilder {
    return this.integer(name);
  }

  /**
   * @description Alias for bigInteger
   * @param name
   * @returns ColumnOptionsBuilder
   */
  public bigint(name: string): ColumnOptionsBuilder {
    return this.bigInteger(name);
  }

  public float(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} FLOAT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public decimal(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public double(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} DOUBLE`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} DOUBLE PRECISION`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public boolean(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BOOLEAN`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );

      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BOOLEAN`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );

      default:
        throw new Error("Unsupported SQL type");
    }
  }

  public date(name: string, options?: DateOptions): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} DATE`;

    if (options && options.autoCreate) {
      this.partialQuery += " DEFAULT CURRENT_DATE";
    }

    if (options && options.autoUpdate) {
      if (this.sqlType === "postgres") {
        throw new Error(
          "Postgres does not support auto updating a date column",
        );
      }

      this.partialQuery += " ON UPDATE CURRENT_DATE";
    }

    return new ColumnOptionsBuilder(
      this.table,
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
        throw new Error(
          "Postgres does not support auto updating a date column",
        );
      }

      this.partialQuery += " ON UPDATE CURRENT_TIMESTAMP";
    }

    return new ColumnOptionsBuilder(
      this.table,
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
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }
}
