import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * SelfRef v2: Add onDelete CASCADE to self-ref
 */
export class SelfRefV2 extends Model {
  static table = "schema_diff_self_ref";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "bigint", nullable: true })
  declare parentId: number | null;

  @belongsTo(() => SelfRefV2, "parentId", { onDelete: "cascade" })
  declare parent: SelfRefV2;
}
