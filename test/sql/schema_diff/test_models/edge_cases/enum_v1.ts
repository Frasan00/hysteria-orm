import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Enum v1: Table with enum column
 */
export class EnumV1 extends Model {
  static table = "schema_diff_enum_test";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 100 })
  declare name: string;

  @column({ type: ["active", "inactive"] as const })
  declare status: string;
}
