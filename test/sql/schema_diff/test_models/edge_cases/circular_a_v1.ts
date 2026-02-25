import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { CircularBV1 } from "./circular_b_v1";

/**
 * CircularA v1: A has FK → B
 */
export class CircularAV1 extends Model {
  static table = "schema_diff_circular_a";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "bigint" })
  declare bId: number;

  @belongsTo(() => CircularBV1, "bId")
  declare b: CircularBV1;
}
