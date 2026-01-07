import {
  column,
  index,
  unique,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * User v7: Modify column bio nullable -> not nullable
 * Tests: columnsToModify (nullable change)
 */
@index(["name"], "idx_schema_diff_users_name")
@unique(["email"], "uq_schema_diff_users_email")
export class UserMigrationV7 extends Model {
  static table = "schema_diff_users";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "varchar", length: 255 })
  declare email: string;

  @column({ type: "bigint" })
  declare age: number;

  @column({ type: "varchar", length: 500, nullable: false })
  declare bio: string;
}
