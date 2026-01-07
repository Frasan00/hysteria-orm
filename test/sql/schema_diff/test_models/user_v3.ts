import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * User v3: Modify column age from integer to bigint
 * Tests: columnsToModify (type change)
 */
export class UserMigrationV3 extends Model {
  static table = "schema_diff_users";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "varchar", length: 255 })
  declare email: string;

  @column({ type: "bigint" })
  declare age: number;
}
