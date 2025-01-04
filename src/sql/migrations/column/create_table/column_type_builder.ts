import logger from "../../../../utils/logger";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import { ColumnBuilder } from "./column_builder";

export type ColumnConstraintsOptions = Omit<
  ColumnTypeBuilder,
  | "string"
  | "varchar"
  | "uuid"
  | "autoGeneratedUUID"
  | "tinytext"
  | "mediumtext"
  | "longtext"
  | "binary"
  | "enum"
  | "text"
  | "char"
  | "tinyint"
  | "smallint"
  | "mediumint"
  | "serial"
  | "bigSerial"
  | "integer"
  | "bigInteger"
  | "int"
  | "bigint"
  | "float"
  | "decimal"
  | "double"
  | "boolean"
  | "date"
  | "timestamp"
  | "jsonb"
>;

export type DateOptions = {
  autoCreate?: boolean;
  autoUpdate?: boolean;
  timezone?: string;
};

export default class ColumnTypeBuilder extends ColumnBuilder {
  constructor(
    table: string,
    queryStatements: string[],
    afterDefinitionQueries: string[],
    partialQuery: string,
    sqlType: SqlDataSourceType,
  ) {
    super(
      table,
      queryStatements,
      afterDefinitionQueries,
      partialQuery,
      sqlType,
    );
  }

  // Types
  string(name: string, length: number = 255): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` VARCHAR(${length})`;
        break;

      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" VARCHAR(${length})`;
        break;

      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  /**
   * @alias string
   */
  varchar(name: string, length: number = 255): ColumnConstraintsOptions {
    this.checkLastComma();
    return this.string(name, length);
  }

  /**
   * @description Generates a UUID
   */
  uuid(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "postgres":
        this.queryStatements.push(
          `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        );

        this.columnName = name;
        this.partialQuery += ` "${name}" UUID`;
        break;
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` CHAR(36)`;
        break;
      case "sqlite":
        logger.warn("sqlite does not support UUID, using text instead");
        this.columnName = name;
        this.partialQuery += ` ${name} TEXT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  /**
   * @description Generates a UUID using the database's built-in function
   */
  autoGeneratedUUID(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "postgres":
        this.queryStatements.push(
          `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        );

        this.columnName = name;
        this.partialQuery += ` "${name}" UUID DEFAULT uuid_generate_v4()`;
        break;
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` CHAR(36) DEFAULT (UUID())`;
        break;
      case "sqlite":
        logger.warn("sqlite does not support UUID, using text instead");
        this.columnName = name;
        this.partialQuery += ` ${name} TEXT DEFAULT (hex(randomblob(16)))`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  tinytext(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` TINYTEXT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  mediumtext(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` MEDIUMTEXT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  longtext(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` LONGTEXT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  /**
   * @description Creates a binary column
   * @description Length has no effect on postgres
   */
  binary(name: string, length: number = 255): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` BINARY(${length})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" BYTEA`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" BLOB(${length})`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  enum(name: string, values: string[]): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` ENUM('${values.join("', '")}')`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT CHECK(${name} IN ('${values.join(
          "', '",
        )}'))`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" CHECK(${name} IN ('${values.join(
          "', '",
        )}'))`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  text(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` TEXT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" TEXT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  char(name: string, length: number = 255): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` CHAR(${length})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" CHAR(${length})`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" CHAR(${length})`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  tinyint(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` TINYINT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" SMALLINT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" TINYINT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  smallint(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` SMALLINT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" SMALLINT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" SMALLINT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  mediumint(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` MEDIUMINT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" INTEGER`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" MEDIUMINT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  /**
   * @description If using mysql, it will automatically add INT AUTO_INCREMENT
   * @description If using sqlite, it will automatically be converted in INTEGER PRIMARY KEY AUTO-INCREMENT because an auto-increment column cannot not be a primary key in sqlite
   */
  serial(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    if (this.sqlType === `mysql` || this.sqlType === `mariadb`) {
      this.columnName = name;
      this.partialQuery += ` \`${name}\` INT AUTO_INCREMENT`;
      return this;
    }

    if (this.sqlType === `sqlite`) {
      this.columnName = name;
      this.partialQuery += ` "${name}" INTEGER PRIMARY KEY AUTOINCREMENT`;
      return this;
    }

    this.columnName = name;
    this.partialQuery += ` "${name}" SERIAL`;
    return this;
  }

  /**
   * @description If using mysql, it will automatically be converted in BIGINT AUTO_INCREMENT
   * @description If using sqlite, it will automatically be converted in INTEGER PRIMARY KEY AUTO-INCREMENT because an auto-increment column cannot not be a primary key in sqlite
   */
  bigSerial(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    if (this.sqlType === `mysql` || this.sqlType === `mariadb`) {
      this.columnName = name;
      this.partialQuery += ` \`${name}\` BIGINT AUTO_INCREMENT`;
      return this;
    }

    if (this.sqlType === `sqlite`) {
      this.columnName = name;
      this.partialQuery += ` "${name}" INTEGER PRIMARY KEY AUTOINCREMENT`;
      return this;
    }

    this.columnName = name;
    this.partialQuery += ` "${name}" BIGSERIAL`;
    return this;
  }

  integer(name: string, length?: number): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` INT ${length ? `(${length})` : ""}`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" INTEGER ${length ? `(${length})` : ""}`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" INTEGER ${length ? `(${length})` : ""}`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  bigInteger(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` BIGINT`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" BIGINT`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" BIGINT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  /**
   * @description Alias for integer
   * @returns ColumnOptionsBuilder
   */
  int(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    return this.integer(name);
  }

  /**
   * @description Alias for bigInteger
   * @returns ColumnOptionsBuilder
   */
  bigint(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    return this.bigInteger(name);
  }

  /**
   * @description Creates a float column
   * @description Precision and scale are only for mysql
   */
  float(
    name: string,
    options: {
      precision: number;
      scale: number;
    } = {
      precision: 10,
      scale: 2,
    },
  ): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` FLOAT(${options.precision}, ${options.scale})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" REAL`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" REAL`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  decimal(
    name: string,
    options: {
      precision: number;
      scale: number;
    } = {
      precision: 10,
      scale: 2,
    },
  ): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` DECIMAL(${options.precision}, ${options.scale})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" DECIMAL(${options.precision}, ${options.scale})`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" DECIMAL(${options.precision}, ${options.scale})`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  /**
   * @description Creates a double column
   * @description Precision and scale are only for mysql
   */
  double(
    name: string,
    options: {
      precision: number;
      scale: number;
    } = {
      precision: 10,
      scale: 2,
    },
  ): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` DOUBLE(${options.precision}, ${options.scale})`;
        break;
      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" DOUBLE PRECISION`;
        break;
      case "sqlite":
        this.columnName = name;
        this.partialQuery += ` "${name}" REAL`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  boolean(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += ` \`${name}\` BOOLEAN`;
        break;

      case "postgres":
        this.columnName = name;
        this.partialQuery += ` "${name}" BOOLEAN`;
        break;
      case "sqlite":
        logger.warn(
          "sqlite does not support boolean columns, using integer instead",
        );
        this.columnName = name;
        this.partialQuery += ` ${name} INTEGER CHECK(${name} IN (0, 1))`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  /**
   * @description Creates a date column
   * @description If autoCreate is true, it will default to the current date
   */
  date(
    name: string,
    options?: Omit<DateOptions, "timezone">,
  ): ColumnConstraintsOptions {
    this.checkLastComma();
    if (this.sqlType === "sqlite") {
      logger.warn("sqlite does not support date columns, using text instead");

      this.columnName = name;
      this.partialQuery += ` ${name} TEXT`;
      if (options && options.autoCreate) {
        this.partialQuery += "  DEFAULT CURRENT_DATE";
      }

      if (options && options.autoUpdate) {
        throw new Error("Sqlite does not support auto updating a date column");
      }

      return this;
    }

    this.columnName = name;
    this.partialQuery += ` ${name} DATE`;

    if (options && options.autoCreate) {
      this.partialQuery += "  DEFAULT CURRENT_DATE";
    }

    if (options && options.autoUpdate) {
      switch (this.sqlType) {
        case "postgres":
          this.afterDefinitionQueries.push(
            `CREATE OR REPLACE FUNCTION update_date_column() RETURNS TRIGGER AS $$
            BEGIN
              NEW.${name} = now();
              RETURN NEW;
            END;
            $$ language 'plpgsql';`,
          );
          break;
        default:
          this.partialQuery += "  ON UPDATE CURRENT_TIMESTAMP";
      }
    }

    return this;
  }

  /**
   * @description Creates a timestamp column
   * @description If autoCreate is true, it will default to the current date
   * @description Auto update does not work for sqlite
   */
  timestamp(name: string, options?: DateOptions): ColumnConstraintsOptions {
    this.checkLastComma();
    if (this.sqlType === "sqlite") {
      logger.warn(
        "sqlite does not support timestamp columns, using text instead",
      );

      this.columnName = name;
      this.partialQuery += ` ${name} TEXT`;
      if (options && options.autoCreate) {
        this.partialQuery += "  DEFAULT CURRENT_TIMESTAMP";
      }

      if (options && options.autoUpdate) {
        throw new Error(
          "Sqlite does not support auto updating a timestamp column",
        );
      }

      if (options && options.timezone) {
        this.partialQuery += ` ${options.timezone}`;
      }

      return this;
    }

    this.columnName = name;
    this.partialQuery += ` ${name} TIMESTAMP`;
    if (options && options.autoCreate) {
      this.partialQuery += "  DEFAULT CURRENT_TIMESTAMP";
    }

    if (options && options.autoUpdate) {
      if (this.sqlType === "postgres") {
        this.afterDefinitionQueries.push(
          `CREATE OR REPLACE FUNCTION update_timestamp_column() RETURNS TRIGGER AS $$
          BEGIN
            NEW.${name} = now();
            RETURN NEW;
          END;
          $$ language 'plpgsql';`,
        );
      }

      if (this.sqlType === "mysql" || this.sqlType === "mariadb") {
        this.partialQuery += "  ON UPDATE CURRENT_TIMESTAMP";
      }
    }

    if (options && options.timezone) {
      this.partialQuery += ` ${options.timezone}`;
    }

    return this;
  }

  /**
   * @description EXPERIMENTAL
   */
  jsonb(name: string): ColumnConstraintsOptions {
    this.checkLastComma();
    this.columnName = name;
    switch (this.sqlType) {
      case "postgres":
        this.partialQuery += ` ${name} JSONB`;
        break;
      case "mariadb":
      case "mysql":
        this.partialQuery += ` ${name} JSON`;
        break;
      case "sqlite":
        logger.warn(
          "sqlite does not support jsonb columns, using text instead",
        );
        this.partialQuery += ` ${name} TEXT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }

    return this;
  }

  //  constraints for columns
  /**
   * @description Makes the column nullable
   */
  nullable(): ColumnConstraintsOptions {
    this.partialQuery += " NULL";
    return this;
  }

  default(value: string | number | boolean): ColumnConstraintsOptions {
    this.partialQuery += ` DEFAULT ${value},`;
    return this;
  }

  /**
   * @description Makes the column unsigned allowing only positive values
   */
  unsigned(): ColumnConstraintsOptions {
    this.partialQuery += " UNSIGNED";
    return this;
  }

  /**
   * @description Makes the column not nullable
   */
  notNullable(): ColumnConstraintsOptions {
    this.partialQuery += " NOT NULL";
    return this;
  }

  /**
   * @description Makes the column the primary key
   */
  primary(): ColumnConstraintsOptions {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.partialQuery += " PRIMARY KEY";
        return this;

      case "postgres":
        this.partialQuery += " PRIMARY KEY";
        return this;

      case "sqlite":
        this.partialQuery += " PRIMARY KEY";
        return this;

      default:
        throw new Error("Unsupported SQL type");
    }
  }

  /**
   * @description Adds an unique constraint
   */
  unique(): ColumnConstraintsOptions {
    this.partialQuery += " UNIQUE";
    return this;
  }

  /**
   * @description Adds an auto increment - only for mysql
   */
  autoIncrement(): ColumnConstraintsOptions {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.partialQuery += " AUTO_INCREMENT";
        return this;

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
   */
  references(
    table: string,
    column: string,
    options?: { onDelete: string; onUpdate: string },
  ): ColumnConstraintsOptions {
    this.columnReferences?.push({
      localColumn: this.columnName,
      table,
      column,
      onDelete: options?.onDelete,
      onUpdate: options?.onUpdate,
    });

    return this;
  }

  private checkLastComma(): void {
    if (this.partialQuery.endsWith("(\n")) {
      return;
    }

    this.partialQuery = this.partialQuery.trim().replace(/,+$/, "");
    if (this.partialQuery && !this.partialQuery.endsWith("(\n")) {
      this.partialQuery += ", ";
    }
  }
}
