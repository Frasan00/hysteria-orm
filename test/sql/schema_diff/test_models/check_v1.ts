import {
  check,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * Check v1: Table with a single CHECK constraint (age >= 0)
 * Tests: checksToAdd on new table creation
 */
@check("age >= 0", "chk_schema_diff_check_items_age_positive")
export class CheckModelV1 extends Model {
  static table = "schema_diff_check_items";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "integer" })
  declare age: number;

  @column({ type: "varchar", length: 20, default: "active" })
  declare status: string;
}
