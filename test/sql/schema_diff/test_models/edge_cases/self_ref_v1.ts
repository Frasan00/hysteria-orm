import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * SelfRef v1: Self-referencing FK (parentId → self)
 */
export class SelfRefV1 extends Model {
  static table = "schema_diff_self_ref";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "bigint", nullable: true })
  declare parentId: number | null;

  @belongsTo(() => SelfRefV1, "parentId")
  declare parent: SelfRefV1;
}
