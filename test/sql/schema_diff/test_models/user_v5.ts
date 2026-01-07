import {
  column,
  index,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * User v5: Add index on name
 * Tests: indexesToAdd
 */
@index(["name"], "idx_schema_diff_users_name")
export class UserMigrationV5 extends Model {
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
