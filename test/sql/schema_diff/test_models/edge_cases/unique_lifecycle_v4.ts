import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * UniqueLifecycle v4: Drop all unique constraints
 */
export class UniqueLifecycleV4 extends Model {
  static table = "schema_diff_unique_lifecycle";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare email: string;

  @column({ type: "varchar", length: 100 })
  declare username: string;

  @column({ type: "varchar", length: 50 })
  declare code: string;
}
