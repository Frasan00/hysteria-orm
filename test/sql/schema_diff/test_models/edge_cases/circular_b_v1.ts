import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * CircularB v1: B created, no FK to A
 */
export class CircularBV1 extends Model {
  static table = "schema_diff_circular_b";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare label: string;
}
