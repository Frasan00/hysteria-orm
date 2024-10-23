import path from "path";
import { SqlDataSource } from "../sql_data_source";
import Schema from "./schema/schema";

export abstract class Migration {
  migrationName: string = path.basename(__filename);
  schema: Schema = new Schema();

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
  async afterUp?(sql: SqlDataSource): Promise<void>;

  /**
   * @description This method is called after the migration has been rolled back
   */
  async afterDown?(sql: SqlDataSource): Promise<void>;
}
