import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Precision v3: Shrink name→varchar(50)
 */
export class PrecisionV3 extends Model {
  static table = "schema_diff_precision";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 50 })
  declare name: string;

  @column({ type: "decimal", precision: 12, scale: 4 })
  declare amount: number;
}
