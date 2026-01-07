import {
  column,
  index,
  unique,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * User v9: Modify default value on bio (set a default string)
 * Tests: columnsToModify (default change)
 */
@index(["name"], "idx_schema_diff_users_name")
@unique(["email"], "uq_schema_diff_users_email")
export class UserMigrationV9 extends Model {
  static table = "schema_diff_users";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "varchar", length: 255 })
  declare email: string;

  @column({ type: "bigint" })
  declare age: number;

  @column({
    type: "varchar",
    length: 500,
    nullable: false,
    default: "No bio provided",
  })
  declare bio: string;

  @column.json({ nullable: true })
  declare metadata: Record<string, unknown> | null;
}
