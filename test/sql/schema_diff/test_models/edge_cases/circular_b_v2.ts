import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { CircularAV2 } from "./circular_a_v2";

/**
 * CircularB v2: B adds FK → A (mutual references)
 */
export class CircularBV2 extends Model {
  static table = "schema_diff_circular_b";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare label: string;

  @column({ type: "bigint" })
  declare aId: number;

  @belongsTo(() => CircularAV2, "aId")
  declare a: CircularAV2;
}
