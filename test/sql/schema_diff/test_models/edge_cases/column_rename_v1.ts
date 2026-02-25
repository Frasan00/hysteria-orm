import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * ColumnRename v1: Table with firstName and lastName
 */
export class ColumnRenameV1 extends Model {
  static table = "schema_diff_col_rename";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare firstName: string;

  @column({ type: "varchar", length: 255 })
  declare lastName: string;
}
