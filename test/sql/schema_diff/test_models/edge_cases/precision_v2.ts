import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Precision v2: Expand name→varchar(255), amount→decimal(12,4)
 */
export class PrecisionV2 extends Model {
  static table = "schema_diff_precision";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "decimal", precision: 12, scale: 4 })
  declare amount: number;
}
