import {
  column,
  manyToMany,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { M2mRight } from "./m2m_right";

/**
 * M2M Left v2: Add onDelete CASCADE to manyToMany
 */
export class M2mLeftV2 extends Model {
  static table = "schema_diff_m2m_left";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @manyToMany(
    () => M2mRight,
    "schema_diff_m2m_pivot",
    {
      leftForeignKey: "leftId",
      rightForeignKey: "rightId",
    },
    { onDelete: "cascade" },
  )
  declare rights: M2mRight[];
}
