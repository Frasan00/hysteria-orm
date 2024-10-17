import path from "path";
import Schema from "./schema/schema";
import { Sql_data_source } from "../sql_data_source";

export abstract class Migration {
  public migrationName: string = path.basename(__filename);
  public schema: Schema = new Schema();

  /**
   * @description This method is called when the migration is to be run
   */
  public abstract up(): Promise<void>;

  /**
   * @description This method is called when the migration is to be rolled back
   */
  public abstract down(): Promise<void>;

  /**
   * @description This method is called after the migration has been run
   */
  public async afterUp?(sql: Sql_data_source): Promise<void>;

  /**
   * @description This method is called after the migration has been rolled back
   */
  public async afterDown?(sql: Sql_data_source): Promise<void>;
}
