import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { CircularBV2 } from "./circular_b_v2";

/**
 * CircularA v2: A has FK → B (unchanged)
 */
export class CircularAV2 extends Model {
  static table = "schema_diff_circular_a";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "bigint" })
  declare bId: number;

  @belongsTo(() => CircularBV2, "bId")
  declare b: CircularBV2;
}
