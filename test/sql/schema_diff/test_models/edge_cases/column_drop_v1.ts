import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * ColumnDrop v1: Table with 5 columns
 */
export class ColumnDropV1 extends Model {
  static table = "schema_diff_col_drop";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "varchar", length: 255 })
  declare email: string;

  @column({ type: "varchar", length: 50 })
  declare phone: string;

  @column({ type: "varchar", length: 500 })
  declare address: string;
}
