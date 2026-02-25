import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * ColumnDrop v2: Drop phone and address columns
 */
export class ColumnDropV2 extends Model {
  static table = "schema_diff_col_drop";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "varchar", length: 255 })
  declare email: string;
}
