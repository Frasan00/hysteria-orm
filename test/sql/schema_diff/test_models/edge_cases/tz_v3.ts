import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * TZ v3: timestamp back to no timezone
 */
export class TzV3 extends Model {
  static table = "schema_diff_tz";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "timestamp", withTimezone: false })
  declare createdAt: Date;
}
