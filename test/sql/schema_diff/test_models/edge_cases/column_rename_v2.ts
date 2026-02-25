import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * ColumnRename v2: "Rename" firstName → fullName (drop + add)
 */
export class ColumnRenameV2 extends Model {
  static table = "schema_diff_col_rename";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare fullName: string;

  @column({ type: "varchar", length: 255 })
  declare lastName: string;
}
