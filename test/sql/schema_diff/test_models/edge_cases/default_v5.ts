import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Default v5: Falsy defaults — empty string, 0, false
 */
export class DefaultV5 extends Model {
  static table = "schema_diff_defaults";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 50, default: "" })
  declare status: string;

  @column({ type: "integer", default: 0 })
  declare count: number;

  @column({ type: "boolean", default: false })
  declare flag: boolean;
}
