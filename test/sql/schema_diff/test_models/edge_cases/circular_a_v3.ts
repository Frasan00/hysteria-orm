import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * CircularA v3: Remove FK to B, keep bId column
 */
export class CircularAV3 extends Model {
  static table = "schema_diff_circular_a";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "bigint" })
  declare bId: number;
}
