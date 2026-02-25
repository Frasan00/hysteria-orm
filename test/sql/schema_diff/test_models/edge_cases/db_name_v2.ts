import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * DbName v2: Add another column with databaseName override, modify original type
 */
export class DbNameV2 extends Model {
  static table = "schema_diff_db_name";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "text", databaseName: "my_custom_field" })
  declare myField: string;

  @column({
    type: "integer",
    databaseName: "another_custom_col",
    nullable: true,
  })
  declare anotherField: number | null;
}
