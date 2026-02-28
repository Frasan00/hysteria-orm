import {
  check,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * Check v3: Remove the age check, keep only the status check
 * Tests: checksToDrop for removed constraint
 */
@check(
  "status IN ('active', 'inactive', 'banned')",
  "chk_schema_diff_check_items_status_valid",
)
export class CheckModelV3 extends Model {
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
