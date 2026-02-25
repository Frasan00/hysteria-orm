import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * TZ v2: timestamp WITH timezone
 */
export class TzV2 extends Model {
  static table = "schema_diff_tz";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "timestamp", withTimezone: true })
  declare createdAt: Date;
}
