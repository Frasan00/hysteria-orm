import path from "path";
import Schema from "./Schema/Schema";

export abstract class Migration {
  public migrationName: string = path.basename(__filename);
  public schema: Schema = new Schema();

  public abstract up(): void;

  public abstract down(): void;
}
