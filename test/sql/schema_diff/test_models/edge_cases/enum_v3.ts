import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Enum v3: Add a new enum column to existing table
 */
export class EnumV3 extends Model {
  static table = "schema_diff_enum_test";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 100 })
  declare name: string;

  @column({ type: ["active", "inactive", "pending"] as const })
  declare status: string;

  @column({ type: ["low", "medium", "high"] as const })
  declare priority: string;
}
