import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * User v4: Add column bio (text, nullable, default null)
 * Tests: columnsToAdd with nullable/default
 */
export class UserMigrationV4 extends Model {
  static table = "schema_diff_users";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "varchar", length: 255 })
  declare email: string;

  @column({ type: "bigint" })
  declare age: number;

  @column({ type: "varchar", length: 500, nullable: true, default: null })
  declare bio: string | null;
}
