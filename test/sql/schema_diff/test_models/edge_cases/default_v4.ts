import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Default v4: Re-add defaults with different values
 */
export class DefaultV4 extends Model {
  static table = "schema_diff_defaults";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 50, default: "pending" })
  declare status: string;

  @column({ type: "integer", default: 42 })
  declare count: number;

  @column({ type: "boolean", default: true })
  declare flag: boolean;
}
