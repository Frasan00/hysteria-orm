import logger from "../../../../utils/logger";
import { SqlDataSourceType } from "../../../sql_data_source";
import ColumnOptionsBuilder from "./column_options_builder";

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

  public string(name: string, length: number = 255): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        break;

      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        break;

      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
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

  public varchar(name: string, length: number = 255): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        break;

      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        break;

      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
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

  public uuid(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} UUID`;
        break;
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(36)`;
        break;
      case "sqlite":
        logger.warn("sqlite does not support UUID, using text instead");
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
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

  public tinytext(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TINYTEXT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
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

  public mediumtext(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMTEXT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
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

  public longtext(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} LONGTEXT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
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

  public binary(name: string, length: number = 255): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BINARY(${length})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BYTEA`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} BLOB(${length})`;
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

  public enum(name: string, values: string[]): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} ENUM('${values.join("', '")}')`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT CHECK(${name} IN ('${values.join(
          "', '",
        )}'))`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} CHECK(${name} IN ('${values.join(
          "', '",
        )}'))`;
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

  public text(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
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

  public char(name: string, length: number = 255): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
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

  public tinyint(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TINYINT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TINYINT`;
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

  public smallint(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
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

  public mediumint(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMINT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMINT`;
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

    if (this.sqlType === `sqlite`) {
      this.columnName = name;
      this.partialQuery += `${name} INTEGER PRIMARY KEY AUTOINCREMENT`;
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
   * @description If using mysql, it will automatically be converted in BIGINT AUTO_INCREMENT
   * @description If using sqlite, it will automatically be converted in INTEGER PRIMARY KEY AUTOINCREMENT
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

    if (this.sqlType === `sqlite`) {
      this.columnName = name;
      this.partialQuery += `${name} INTEGER PRIMARY KEY AUTOINCREMENT`;
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
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER ${length ? `(${length})` : ""}`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER ${length ? `(${length})` : ""}`;
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

  public bigInteger(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
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

  public float(
    name: string,
    options: {
      precision: number;
      scale: number;
    } = {
      precision: 10,
      scale: 2,
    },
  ): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} FLOAT(${options.precision}, ${options.scale})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
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

  public decimal(
    name: string,
    options: {
      precision: number;
      scale: number;
    } = {
      precision: 10,
      scale: 2,
    },
  ): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL(${options.precision}, ${options.scale})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL(${options.precision}, ${options.scale})`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL(${options.precision}, ${options.scale})`;
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

  public double(
    name: string,
    options: {
      precision: number;
      scale: number;
    } = {
      precision: 10,
      scale: 2,
    },
  ): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} DOUBLE(${options.precision}, ${options.scale})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} DOUBLE PRECISION`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
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

  public boolean(name: string): ColumnOptionsBuilder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BOOLEAN`;
        break;

      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BOOLEAN`;
        break;
      case "sqlite":
        logger.warn(
          "sqlite does not support boolean columns, using integer instead",
        );
        this.columnName = name;
        this.partialQuery += `${name} INTEGER CHECK(${name} IN (0, 1))`;
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

  public date(name: string, options?: DateOptions): ColumnOptionsBuilder {
    if (this.sqlType === "sqlite") {
      logger.warn("sqlite does not support date columns, using text instead");

      this.columnName = name;
      this.partialQuery += `${name} TEXT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

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
    if (this.sqlType === "sqlite") {
      logger.warn(
        "sqlite does not support timestamp columns, using text instead",
      );

      this.columnName = name;
      this.partialQuery += `${name} TEXT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

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
      case "sqlite":
        logger.warn(
          "sqlite does not support jsonb columns, using text instead",
        );
        this.partialQuery += `${name} TEXT`;
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

    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }
}
