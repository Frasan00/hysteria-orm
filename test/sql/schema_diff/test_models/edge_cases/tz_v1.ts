import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * TZ v1: timestamp without timezone
 */
export class TzV1 extends Model {
  static table = "schema_diff_tz";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "timestamp" })
  declare createdAt: Date;
}
