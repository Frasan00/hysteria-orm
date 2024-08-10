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
    tableName: string,
    options?: { ifNotExists?: boolean },
  ): ColumnBuilderConnector {
    const partialQuery =
      options && options.ifNotExists
        ? createTableTemplate.createTableIfNotExists(tableName, this.sqlType)
        : createTableTemplate.createTable(tableName, this.sqlType);

    return new ColumnBuilderConnector(
      tableName,
      this.queryStatements,
      partialQuery,
      this.sqlType,
    );
  }

  /**
   * @description Alter table
   * @param tableName
   * @returns ColumnBuilderAlter
   */
  public alterTable(tableName: string) {
    return new ColumnBuilderAlter(
      tableName,
      this.queryStatements,
      "",
      this.sqlType,
    );
  }

  /**
   * @description Drop table
   * @param tableName
   * @param ifExists
   * @returns void
   */
  public dropTable(tableName: string, ifExists: boolean = false): void {
    this.rawQuery(dropTableTemplate(tableName, ifExists, this.sqlType));
  }

  /**
   * @description Rename table
   * @param oldTableName
   * @param newTableName
   * @returns void
   */
  public renameTable(oldTableName: string, newTableName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `RENAME TABLE \`${oldTableName}\` TO \`${newTableName}\``,
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${oldTableName}" RENAME TO "${newTableName}"`,
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Truncate table
   * @param tableName
   * @returns void
   */
  public truncateTable(tableName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`TRUNCATE TABLE \`${tableName}\``);
        break;
      case "postgres":
        this.rawQuery(`TRUNCATE TABLE "${tableName}"`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Create index on table
   * @param tableName
   * @param indexName
   * @param columns
   * @param unique
   * @returns void
   */
  public createIndex(
    tableName: string,
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
          } INDEX ${indexName} ON \`${tableName}\` (${columns.join(", ")})`,
        );
        break;
      case "postgres":
        this.rawQuery(
          `CREATE ${
            unique ? "UNIQUE" : ""
          } INDEX ${indexName} ON "${tableName}" (${columns.join(", ")})`,
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Drop index on table
   * @param tableName
   * @param indexName
   * @returns void
   */
  public dropIndex(tableName: string, indexName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`DROP INDEX \`${indexName}\` ON \`${tableName}\``);
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
   * @param tableName
   * @param columnName
   * @param type
   * @param options
   * @returns void
   */
  public addPrimaryKey(tableName: string, columns: string[]): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${tableName}\` ADD PRIMARY KEY (${columns.join(
            ", ",
          )})`,
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${tableName}" ADD PRIMARY KEY (${columns.join(", ")})`,
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Drops a primary key from a table
   * @param tableName
   * @returns void
   */
  public dropPrimaryKey(tableName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`ALTER TABLE \`${tableName}\` DROP PRIMARY KEY`);
        break;
      case "postgres":
        this.rawQuery(`ALTER TABLE "${tableName}" DROP CONSTRAINT PRIMARY KEY`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Adds a foreign key to a table
   * @param tableName
   * @param constraintName
   * @param columns
   * @returns void
   */
  public addConstraint(
    tableName: string,
    constraintName: string,
    columns: string[],
  ): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${tableName}\` ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", ",
          )}) REFERENCES ${columns[0].split("_")[0]}s(id)`,
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${tableName}" ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
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
   * @param tableName
   * @param constraintName
   * @returns void
   */
  public dropConstraint(tableName: string, constraintName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY ${constraintName}`,
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${tableName}" DROP CONSTRAINT ${constraintName}`,
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }

  /**
   * @description Adds a unique constraint to a table
   * @param tableName
   * @param constraintName
   * @param columns
   * @returns void
   */
  public addUniqueConstraint(
    tableName: string,
    constraintName: string,
    columns: string[],
  ): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${tableName}\` ADD CONSTRAINT ${constraintName} UNIQUE (${columns.join(
            ", ",
          )})`,
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${tableName}" ADD CONSTRAINT ${constraintName} UNIQUE (${columns.join(
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
   * @param tableName
   * @param constraintName
   * @returns void
   */
  public dropUniqueConstraint(tableName: string, constraintName: string): void {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${tableName}\` DROP INDEX ${constraintName}`,
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${tableName}" DROP CONSTRAINT ${constraintName}`,
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
}
