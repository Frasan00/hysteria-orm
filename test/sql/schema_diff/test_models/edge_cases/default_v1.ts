import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Default v1: Columns with default values
 */
export class DefaultV1 extends Model {
  static table = "schema_diff_defaults";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 50, default: "active" })
  declare status: string;

  @column({ type: "integer", default: 0 })
  declare count: number;

  @column({ type: "boolean", default: true })
  declare flag: boolean;
}
