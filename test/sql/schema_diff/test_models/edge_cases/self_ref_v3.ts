import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * SelfRef v3: Remove parentId FK, add managerId self-ref FK
 */
export class SelfRefV3 extends Model {
  static table = "schema_diff_self_ref";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @column({ type: "bigint", nullable: true })
  declare parentId: number | null;

  @column({ type: "bigint", nullable: true })
  declare managerId: number | null;

  @belongsTo(() => SelfRefV3, "managerId", { onDelete: "set null" })
  declare manager: SelfRefV3;
}
