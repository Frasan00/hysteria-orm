import fs from "node:fs";
import path from "node:path";
import { HysteriaError } from "../../../errors/hysteria_error";
import createTableTemplate from "../../resources/migrations/CREATE_TABLE";
import dropTableTemplate from "../../resources/migrations/DROP_TABLE";
import type { SqlDataSourceType } from "../../sql_data_source_types";
import ColumnBuilderAlter from "../column/alter_table/column_builder_alter";
import ColumnTypeBuilder from "../column/create_table/column_type_builder";
import { SqlDataSource } from "../../sql_data_source";

export default class Schema {
  queryStatements: string[];
  sqlType: SqlDataSourceType;

  constructor(sqlType?: SqlDataSourceType) {
    this.sqlType = (sqlType || process.env.DB_TYPE) as SqlDataSourceType;

    if (!this.sqlType) {
      throw new HysteriaError("Schema::constructor", "ENV_NOT_SET");
    }

    this.queryStatements = [];
  }

  /**
   * @description Add raw query to the migration
   */
  rawQuery(query: string): void {
    this.queryStatements.push(query);
  }

  /**
   * @description Runs the sql in the given file, throws error if file does not exist or is not .sql or .txt
   * @description IMPORTANT: migration cli is always intended to be run from the root of the project so choose the file path accordingly
   */
  runFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new HysteriaError(
        "Schema::runFile",
        `FILE_NOT_FOUND_OR_NOT_ACCESSIBLE`,
      );
    }

    const file = path.basename(filePath);
    const fileExtension = path.extname(file);
    if (fileExtension !== ".sql" && fileExtension !== ".txt") {
      throw new HysteriaError("Schema::runFile", `FILE_NOT_A_SQL_OR_TXT_FILE`);
    }

    const query = fs.readFileSync(filePath, "utf-8");
    this.rawQuery(query);
  }

  /**
   * @description Create table constructor
   */
  createTable(
    table: string,
    cb: (table: ColumnTypeBuilder) => void,
    options?: { ifNotExists?: boolean },
  ): void {
    const partialQuery =
      options && options.ifNotExists
        ? createTableTemplate.createTableIfNotExists(table, this.sqlType)
        : createTableTemplate.createTable(table, this.sqlType);

    const tableBuilder = new ColumnTypeBuilder(
      table,
      this.queryStatements,
      [],
      partialQuery,
      this.sqlType,
    );

    cb(tableBuilder);
    tableBuilder.commit();
  }

  /**
   * @description Alter table constructor
   */
  alterTable(table: string, cb: (table: ColumnBuilderAlter) => void): void {
    const tableAlter = new ColumnBuilderAlter(
      table,
      this.queryStatements,
      "",
      this.sqlType,
    );

    cb(tableAlter);
    tableAlter.commit();
  }

  /**
   * @description Drop table in the database
   */
  dropTable(table: string, ifExists: boolean = false): void {
    this.rawQuery(dropTableTemplate(table, ifExists, this.sqlType));
  }

  /**
   * @description Rename table in the database
   */
  renameTable(oldtable: string, newtable: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`RENAME TABLE \`${oldtable}\` TO \`${newtable}\``);
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(`ALTER TABLE "${oldtable}" RENAME TO "${newtable}"`);
        break;
      case "sqlite":
        this.rawQuery(`ALTER TABLE "${oldtable}" RENAME TO "${newtable}"`);
        break;
      default:
        throw new HysteriaError(
          "Schema::renameTable",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Truncate table
   */
  truncateTable(table: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`TRUNCATE TABLE \`${table}\``);
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(`TRUNCATE TABLE "${table}"`);
        break;
      case "sqlite":
        this.rawQuery(`DELETE FROM "${table}"`);
        break;
      default:
        throw new HysteriaError(
          "Schema::truncateTable",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Create index on table
   */
  createIndex(
    table: string,
    columns: string[],
    indexName?: string,
    unique: boolean = false,
  ): void {
    indexName = indexName || `${table}_${columns.join("_")}_index`;
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `CREATE ${
            unique ? "UNIQUE" : ""
          } INDEX ${indexName} ON \`${table}\` (${columns.join(", ")})`,
        );
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(
          `CREATE ${
            unique ? "UNIQUE" : ""
          } INDEX ${indexName} ON "${table}" (${columns.join(", ")})`,
        );
        break;
      case "sqlite":
        this.rawQuery(
          `CREATE ${
            unique ? "UNIQUE" : ""
          } INDEX ${indexName} ON "${table}" (${columns.join(", ")})`,
        );
        break;
      default:
        throw new HysteriaError(
          "Schema::createIndex",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Drop index on table
   * @mysql requires table name for index drop
   */
  dropIndex(indexName: string, table?: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        if (!table) {
          throw new HysteriaError(
            "Schema::dropIndex",
            "MYSQL_REQUIRES_TABLE_NAME_FOR_INDEX_DROP",
          );
        }

        this.rawQuery(`DROP INDEX \`${indexName}\` ON \`${table}\``);
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(`DROP INDEX ${indexName}`);
        break;
      case "sqlite":
        this.rawQuery(`DROP INDEX ${indexName}`);
        break;
      default:
        throw new HysteriaError(
          "Schema::dropIndex",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Adds a primary key to a table
   */
  addPrimaryKey(table: string, columns: string[]): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${table}\` ADD PRIMARY KEY (${columns.join(", ")})`,
        );
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD PRIMARY KEY (${columns.join(", ")})`,
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD PRIMARY KEY (${columns.join(", ")})`,
        );
        break;
      default:
        throw new HysteriaError(
          "Schema::renameTable",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Drops a primary key from a table
   */
  dropPrimaryKey(table: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`ALTER TABLE \`${table}\` DROP PRIMARY KEY`);
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(`ALTER TABLE "${table}" DROP CONSTRAINT PRIMARY KEY`);
        break;
      case "sqlite":
        this.rawQuery(`ALTER TABLE "${table}" DROP PRIMARY KEY`);
        break;
      default:
        throw new HysteriaError(
          "Schema::renameTable",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Adds a foreign key to a table
   */
  addConstraint(
    table: string,
    columns: string[],
    foreignTable: string,
    foreignColumns: string[],
    constraintName?: string,
  ): void {
    if (!constraintName) {
      constraintName = `${table}_${columns.join("_")}_fk`;
    }

    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${table}\` ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", ",
          )}) REFERENCES \`${foreignTable}\` (${foreignColumns.join(", ")})`,
        );
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", ",
          )}) REFERENCES \`${foreignTable}\` (${foreignColumns.join(", ")})`,
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", ",
          )}) REFERENCES \`${foreignTable}\` (${foreignColumns.join(", ")})`,
        );
        break;
      default:
        throw new HysteriaError(
          "Schema::renameTable",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Drops a cosntraint from a table
   */
  dropConstraint(table: string, constraintName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${table}\` DROP FOREIGN KEY ${constraintName}`,
        );
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(
          `ALTER TABLE "${table}" DROP CONSTRAINT ${constraintName}`,
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE "${table}" DROP CONSTRAINT ${constraintName}`,
        );
        break;
      default:
        throw new HysteriaError(
          "Schema::renameTable",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Adds a unique constraint to a table
   */
  unique(table: string, columns: string[], constraintName?: string): void {
    if (!constraintName) {
      constraintName = `${table}_${columns.join("_")}_unique`;
    }

    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${table}\` ADD CONSTRAINT ${constraintName} UNIQUE (${columns.join(
            ", ",
          )})`,
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE \`${table}\` ADD CONSTRAINT ${constraintName} UNIQUE (${columns.join(
            ", ",
          )})`,
        );
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD CONSTRAINT ${constraintName} UNIQUE (${columns.join(
            ", ",
          )})`,
        );
        break;
      default:
        throw new HysteriaError(
          "Schema::renameTable",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }

  /**
   * @description Drops a unique constraint from a table
   */
  dropUnique(table: string, constraintName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`ALTER TABLE \`${table}\` DROP INDEX ${constraintName}`);
        break;
      case "postgres":
      case "cockroachdb":
        this.rawQuery(
          `ALTER TABLE "${table}" DROP CONSTRAINT ${constraintName}`,
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE "${table}" DROP CONSTRAINT ${constraintName}`,
        );
        break;
      default:
        throw new HysteriaError(
          "Schema::renameTable",
          `UNSUPPORTED_DATABASE_TYPE_${this.sqlType}`,
        );
    }
  }
}
