import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * DbName v1: Column with databaseName override
 */
export class DbNameV1 extends Model {
  static table = "schema_diff_db_name";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255, databaseName: "my_custom_field" })
  declare myField: string;
}
