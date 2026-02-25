import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * M2M Left v3: Remove manyToMany — no relation defined
 */
export class M2mLeftV3 extends Model {
  static table = "schema_diff_m2m_left";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;
}
