import path from "path";
import Schema from "./Schema/Schema";

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
  public async afterUp?(): Promise<void> {}

  /**
   * @description This method is called after the migration has been rolled back
   */
  public async afterDown?(): Promise<void> {}
}
