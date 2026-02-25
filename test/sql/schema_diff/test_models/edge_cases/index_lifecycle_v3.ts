import {
  column,
  index,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * IndexLifecycle v3: Drop single index, keep composite
 */
@index(["colB", "colC"], "idx_sd_il_col_b_c")
export class IndexLifecycleV3 extends Model {
  static table = "schema_diff_index_lifecycle";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare colA: string;

  @column({ type: "varchar", length: 255 })
  declare colB: string;

  @column({ type: "varchar", length: 255 })
  declare colC: string;
}
