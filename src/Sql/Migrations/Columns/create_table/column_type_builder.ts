import { SqlDataSourceType } from "../../../../datasource";
import logger from "../../../../logger";
import Column_options_builder from "./column_options_builder";

export type DateOptions = {
  autoCreate?: boolean;
  autoUpdate?: boolean;
};

export default class Column_type_builder {
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

  public string(name: string, length: number = 255) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );

      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );

      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
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

  public varchar(name: string, length: number = 255): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );

      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );

      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
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

  public uuid(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} UUID`;
        return new Column_options_builder(
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
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        logger.warn("sqlite does not support UUID, using text instead");
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
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

  public tinytext(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TINYTEXT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
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

  public mediumtext(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMTEXT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
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

  public longtext(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} LONGTEXT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
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

  public binary(name: string, length: number = 255): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BINARY(${length})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BYTEA`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} BLOB(${length})`;
        return new Column_options_builder(
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

  public enum(name: string, values: string[]): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} ENUM('${values.join("', '")}')`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT CHECK(${name} IN ('${values.join(
          "', '",
        )}'))`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} CHECK(${name} IN ('${values.join(
          "', '",
        )}'))`;
        return new Column_options_builder(
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

  public text(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new Column_options_builder(
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

  public char(name: string, length: number = 255): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        return new Column_options_builder(
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

  public tinyint(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TINYINT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TINYINT`;
        return new Column_options_builder(
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

  public smallint(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new Column_options_builder(
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

  public mediumint(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMINT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMINT`;
        return new Column_options_builder(
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
  public serial(name: string): Column_options_builder {
    if (this.sqlType === `mysql` || this.sqlType === `mariadb`) {
      this.columnName = name;
      this.partialQuery += `${name} INT AUTO_INCREMENT`;
      return new Column_options_builder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

    if (this.sqlType === `sqlite`) {
      this.columnName = name;
      this.partialQuery += `${name} INTEGER AUTOINCREMENT`;
      return new Column_options_builder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

    this.columnName = name;
    this.partialQuery += `${name} SERIAL`;
    return new Column_options_builder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  /**
   * @description If not using postgres, it will automatically be converted in BIGINT AUTO_INCREMENT
   * @description If using sqlite, it will automatically be converted in INTEGER PRIMARY KEY AUTOINCREMENT
   * @param name
   */
  public bigSerial(name: string): Column_options_builder {
    if (this.sqlType === `mysql` || this.sqlType === `mariadb`) {
      this.columnName = name;
      this.partialQuery += `${name} BIGINT AUTO_INCREMENT`;
      return new Column_options_builder(
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
      return new Column_options_builder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

    this.columnName = name;
    this.partialQuery += `${name} BIGSERIAL`;
    return new Column_options_builder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public integer(name: string, length?: number): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} INT ${length ? `(${length})` : ""}`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER ${length ? `(${length})` : ""}`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER ${length ? `(${length})` : ""}`;
        return new Column_options_builder(
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

  public bigInteger(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        return new Column_options_builder(
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
   * @returns Column_options_builder
   */
  public int(name: string): Column_options_builder {
    return this.integer(name);
  }

  /**
   * @description Alias for bigInteger
   * @param name
   * @returns Column_options_builder
   */
  public bigint(name: string): Column_options_builder {
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
  ): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} FLOAT(${options.precision}, ${options.scale})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
        return new Column_options_builder(
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

  public decimal(
    name: string,
    options: {
      precision: number;
      scale: number;
    } = {
      precision: 10,
      scale: 2,
    },
  ): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL(${options.precision}, ${options.scale})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL(${options.precision}, ${options.scale})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL(${options.precision}, ${options.scale})`;
        return new Column_options_builder(
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

  public double(
    name: string,
    options: {
      precision: number;
      scale: number;
    } = {
      precision: 10,
      scale: 2,
    },
  ): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} DOUBLE(${options.precision}, ${options.scale})`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} DOUBLE PRECISION`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
        return new Column_options_builder(
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

  public boolean(name: string): Column_options_builder {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BOOLEAN`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );

      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BOOLEAN`;
        return new Column_options_builder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
        );
      case "sqlite":
        logger.warn(
          "sqlite does not support boolean columns, using integer instead",
        );
        this.columnName = name;
        this.partialQuery += `${name} INTEGER CHECK(${name} IN (0, 1))`;
        return new Column_options_builder(
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

  public date(name: string, options?: DateOptions): Column_options_builder {
    if (this.sqlType === "sqlite") {
      logger.warn("sqlite does not support date columns, using text instead");

      this.columnName = name;
      this.partialQuery += `${name} TEXT`;
      return new Column_options_builder(
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

    return new Column_options_builder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public timestamp(
    name: string,
    options?: DateOptions,
  ): Column_options_builder {
    if (this.sqlType === "sqlite") {
      logger.warn(
        "sqlite does not support timestamp columns, using text instead",
      );

      this.columnName = name;
      this.partialQuery += `${name} TEXT`;
      return new Column_options_builder(
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

    return new Column_options_builder(
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
  public jsonb(name: string): Column_options_builder {
    if (this.sqlType === "sqlite") {
      throw new Error(
        "sqlite does not support jsonb columns, use text instead",
      );
    }

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

    return new Column_options_builder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }
}
