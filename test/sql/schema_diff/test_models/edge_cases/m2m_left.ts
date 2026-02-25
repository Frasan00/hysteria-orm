import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * M2M Left model (fixed across versions)
 */
export class M2mLeft extends Model {
  static table = "schema_diff_m2m_left";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;
}
