import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * TypeChange v2: count→bigint, price→varchar(255), status→text
 */
export class TypeChangeV2 extends Model {
  static table = "schema_diff_type_change";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "bigint" })
  declare count: number;

  @column({ type: "varchar", length: 255 })
  declare price: string;

  @column({ type: "text" })
  declare status: string;
}
