import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * M2M Right model (fixed across versions)
 */
export class M2mRight extends Model {
  static table = "schema_diff_m2m_right";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 100 })
  declare tag: string;
}
