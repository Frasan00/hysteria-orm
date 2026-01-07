import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * User v1: Basic table creation
 * - id (bigIncrement)
 * - name (varchar)
 * - email (varchar)
 */
export class UserMigrationV1 extends Model {
  static table = "schema_diff_users";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "varchar", length: 255 })
  declare email: string;
}
