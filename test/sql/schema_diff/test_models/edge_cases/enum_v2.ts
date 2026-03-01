import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Enum v2: Enum column with added value ("pending")
 */
export class EnumV2 extends Model {
  static table = "schema_diff_enum_test";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 100 })
  declare name: string;

  @column({ type: ["active", "inactive", "pending"] as const })
  declare status: string;
}
