import path from "path";
import { fileURLToPath } from "url";
import Schema from "./schema/schema";

export abstract class Migration {
  migrationName: string = path.basename(fileURLToPath(import.meta.url));
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
  async afterMigration?(): Promise<void>;
}
