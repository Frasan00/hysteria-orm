import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Default v3: Remove all defaults
 */
export class DefaultV3 extends Model {
  static table = "schema_diff_defaults";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 50 })
  declare status: string;

  @column({ type: "integer" })
  declare count: number;

  @column({ type: "boolean" })
  declare flag: boolean;
}
