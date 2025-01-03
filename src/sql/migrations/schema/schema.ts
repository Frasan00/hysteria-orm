import dotenv from "dotenv";
import createTableTemplate from "../../resources/migrations/CREATE_TABLE";
import dropTableTemplate from "../../resources/migrations/DROP_TABLE";
import ColumnBuilderAlter from "../column/alter_table/column_builder_alter";
import { SqlDataSourceType } from "../../sql_data_source_types";
import ColumnTypeBuilder from "../column/create_table/column_type_builder";
import { StandaloneQueryBuilder } from "../../standalone_query_builder/standalone_sql_query_builder";
import { CaseConvention } from "../../../utils/case_utils";

dotenv.config();

export default class Schema {
  queryStatements: string[];
  sqlType: SqlDataSourceType;

  constructor(sqlType?: SqlDataSourceType) {
    this.sqlType = (sqlType || process.env.DB_TYPE) as SqlDataSourceType;

    if (!this.sqlType) {
      throw new Error(`No DB_TYPE specified in the environment variables`);
    }

    this.queryStatements = [];
  }

  /**
   * @description Gets an instance of the query builder and adds it to the current migration
   * @description Default database convention is snake case
   */
  useQueryBuilder(
    table: string,
    cb: (
      queryBuilder: Omit<StandaloneQueryBuilder, "select" | "toSql">,
    ) => string,
    options?: {
      databaseCaseConvention?: CaseConvention;
    },
  ): void {
    const standaloneQueryBuilder = new StandaloneQueryBuilder(
      this.sqlType,
      table,
      "none",
      options?.databaseCaseConvention || "snake",
    );

    this.rawQuery(cb(standaloneQueryBuilder));
  }

  /**
   * @description Add raw query to the migration
   */
  rawQuery(query: string): void {
    this.queryStatements.push(query);
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
   * @description Drop table
   * @param table
   * @param ifExists
   * @returns void
   */
  dropTable(table: string, ifExists: boolean = false): void {
    this.rawQuery(dropTableTemplate(table, ifExists, this.sqlType));
  }

  /**
   * @description Rename table
   * @param oldtable
   * @param newtable
   * @returns void
   */
  renameTable(oldtable: string, newtable: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`RENAME TABLE \`${oldtable}\` TO \`${newtable}\``);
        break;
      case "postgres":
        this.rawQuery(`ALTER TABLE "${oldtable}" RENAME TO "${newtable}"`);
        break;
      case "sqlite":
        this.rawQuery(`ALTER TABLE "${oldtable}" RENAME TO "${newtable}"`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Truncate table
   * @param table
   * @returns void
   */
  truncateTable(table: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`TRUNCATE TABLE \`${table}\``);
        break;
      case "postgres":
        this.rawQuery(`TRUNCATE TABLE "${table}"`);
        break;
      case "sqlite":
        this.rawQuery(`DELETE FROM "${table}"`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Create index on table
   * @param table
   * @param indexName
   * @param columns
   * @param unique
   * @returns void
   */
  createIndex(
    table: string,
    indexName: string,
    columns: string[],
    unique: boolean = false,
  ): void {
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
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Drop index on table
   * @param table
   * @param indexName
   * @returns void
   */
  dropIndex(table: string, indexName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`DROP INDEX \`${indexName}\` ON \`${table}\``);
        break;
      case "postgres":
        this.rawQuery(`DROP INDEX ${indexName}`);
        break;
      case "sqlite":
        this.rawQuery(`DROP INDEX ${indexName}`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Adds a primary key to a table
   * @param table
   * @param columnName
   * @param type
   * @param options
   * @returns void
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
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Drops a primary key from a table
   * @param table
   * @returns void
   */
  dropPrimaryKey(table: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`ALTER TABLE \`${table}\` DROP PRIMARY KEY`);
        break;
      case "postgres":
        this.rawQuery(`ALTER TABLE "${table}" DROP CONSTRAINT PRIMARY KEY`);
        break;
      case "sqlite":
        this.rawQuery(`ALTER TABLE "${table}" DROP PRIMARY KEY`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Adds a foreign key to a table
   * @param table
   * @param constraintName
   * @param columns
   * @returns void
   */
  addConstraint(
    table: string,
    constraintName: string,
    columns: string[],
  ): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${table}\` ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", ",
          )}) REFERENCES ${columns[0].split("_")[0]}s(id)`,
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", ",
          )}) REFERENCES ${columns[0].split("_")[0]}s(id)`,
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", ",
          )}) REFERENCES ${columns[0].split("_")[0]}s(id)`,
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Drops a cosntraint from a table
   * @param table
   * @param constraintName
   * @returns void
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
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Adds a unique constraint to a table
   * @param table
   * @param constraintName
   * @param columns
   * @returns void
   */
  addUniqueConstraint(
    table: string,
    constraintName: string,
    columns: string[],
  ): void {
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
        this.rawQuery(
          `ALTER TABLE "${table}" ADD CONSTRAINT ${constraintName} UNIQUE (${columns.join(
            ", ",
          )})`,
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Drops a unique constraint from a table
   * @param table
   * @param constraintName
   * @returns void
   */
  dropUniqueConstraint(table: string, constraintName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`ALTER TABLE \`${table}\` DROP INDEX ${constraintName}`);
        break;
      case "postgres":
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
        throw new Error("Unsupported database type");
    }
  }
}
