import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { CircularAV3 } from "./circular_a_v3";

/**
 * CircularB v3: Keep FK → A
 */
export class CircularBV3 extends Model {
  static table = "schema_diff_circular_b";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare label: string;

  @column({ type: "bigint" })
  declare aId: number;

  @belongsTo(() => CircularAV3, "aId")
  declare a: CircularAV3;
}
