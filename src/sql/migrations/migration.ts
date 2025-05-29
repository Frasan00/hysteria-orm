import path from "path";
import { fileURLToPath } from "url";
import Schema from "./schema/schema";
import { SqlDataSource } from "../sql_data_source";
import { SqlDataSourceType } from "../sql_data_source_types";

export abstract class Migration {
  declare dbType: SqlDataSourceType;
  declare migrationName: string;
  declare schema: Schema;

  constructor(dbType: SqlDataSourceType) {
    this.dbType = dbType;
    this.migrationName = path.basename(fileURLToPath(import.meta.url));
    this.schema = new Schema(this.dbType);
  }

  /**
   * @description This method is called when the migration is to be run
   */
  abstract up(): Promise<void>;

  /**
   * @description This method is called when the migration is to be rolled back
   */
  abstract down(): Promise<void>;

  /**
   * @description This method is called after the migration has been run
   */
  async afterMigration?(sqlDataSource: SqlDataSource): Promise<void>;
}
