import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * TypeChange v3: Revert count→integer, price→text
 */
export class TypeChangeV3 extends Model {
  static table = "schema_diff_type_change";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "integer" })
  declare count: number;

  @column({ type: "text" })
  declare price: string;

  @column({ type: "text" })
  declare status: string;
}
