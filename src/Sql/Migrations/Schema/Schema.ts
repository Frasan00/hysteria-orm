import dotenv from "dotenv";
import createTableTemplate from "../../Resources/Migration/CREATETABLE";
import ColumnBuilderConnector from "../Columns/CreateTable/ColumnBuilderConnector";
import dropTableTemplate from "../../Resources/Migration/DROPTABLE";
import ColumnBuilderAlter from "../Columns/AlterTable/ColumnBuilderAlter";
import { DataSourceType } from "../../../Datasource";

dotenv.config();

export default class Schema {
  public queryStatements: string[];
  public sqlType: DataSourceType;

  constructor(sqlType?: DataSourceType) {
    this.queryStatements = [];
    this.sqlType = (sqlType ||
      process.env.DB_TYPE ||
      "mysql") as DataSourceType;
  }

  /**
   * @description Add raw query to the migration
   * @param query
   */
  public rawQuery(query: string): void {
    this.queryStatements.push(query);
  }

  public createTable(
    table: string,
    options?: { ifNotExists?: boolean },
  ): ColumnBuilderConnector {
    const partialQuery =
      options && options.ifNotExists
        ? createTableTemplate.createTableIfNotExists(table, this.sqlType)
        : createTableTemplate.createTable(table, this.sqlType);

    return new ColumnBuilderConnector(
      table,
      this.queryStatements,
      partialQuery,
      this.sqlType,
    );
  }

  /**
   * @description Alter table
   * @param table
   * @returns ColumnBuilderAlter
   */
  public alterTable(table: string) {
    return new ColumnBuilderAlter(
      table,
      this.queryStatements,
      "",
      this.sqlType,
    );
  }

  /**
   * @description Drop table
   * @param table
   * @param ifExists
   * @returns void
   */
  public dropTable(table: string, ifExists: boolean = false): void {
    this.rawQuery(dropTableTemplate(table, ifExists, this.sqlType));
  }

  /**
   * @description Rename table
   * @param oldtable
   * @param newtable
   * @returns void
   */
  public renameTable(oldtable: string, newtable: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`RENAME TABLE \`${oldtable}\` TO \`${newtable}\``);
        break;
      case "postgres":
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
  public truncateTable(table: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`TRUNCATE TABLE \`${table}\``);
        break;
      case "postgres":
        this.rawQuery(`TRUNCATE TABLE "${table}"`);
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
  public createIndex(
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
  public dropIndex(table: string, indexName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`DROP INDEX \`${indexName}\` ON \`${table}\``);
        break;
      case "postgres":
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
  public addPrimaryKey(table: string, columns: string[]): void {
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
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Drops a primary key from a table
   * @param table
   * @returns void
   */
  public dropPrimaryKey(table: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`ALTER TABLE \`${table}\` DROP PRIMARY KEY`);
        break;
      case "postgres":
        this.rawQuery(`ALTER TABLE "${table}" DROP CONSTRAINT PRIMARY KEY`);
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
  public addConstraint(
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
  public dropConstraint(table: string, constraintName: string): void {
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
  public addUniqueConstraint(
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
  public dropUniqueConstraint(table: string, constraintName: string): void {
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
      default:
        throw new Error("Unsupported database type");
    }
  }
}
