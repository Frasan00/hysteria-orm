import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * User v2: Add column age (integer)
 * Tests: columnsToAdd
 */
export class UserMigrationV2 extends Model {
  static table = "schema_diff_users";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "varchar", length: 255 })
  declare email: string;

  @column.integer()
  declare age: number;
}
