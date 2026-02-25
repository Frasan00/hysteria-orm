import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Precision v1: Initial lengths and precision
 */
export class PrecisionV1 extends Model {
  static table = "schema_diff_precision";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 100 })
  declare name: string;

  @column({ type: "decimal", precision: 8, scale: 2 })
  declare amount: number;
}
