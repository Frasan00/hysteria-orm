import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Default v2: Change all defaults
 */
export class DefaultV2 extends Model {
  static table = "schema_diff_defaults";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 50, default: "inactive" })
  declare status: string;

  @column({ type: "integer", default: 10 })
  declare count: number;

  @column({ type: "boolean", default: false })
  declare flag: boolean;
}
