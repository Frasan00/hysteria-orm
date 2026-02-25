import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * ColumnDrop v3: Drop email, add website — simultaneous add + drop
 */
export class ColumnDropV3 extends Model {
  static table = "schema_diff_col_drop";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "varchar", length: 500 })
  declare website: string;
}
