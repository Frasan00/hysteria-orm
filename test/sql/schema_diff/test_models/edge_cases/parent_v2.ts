import {
  column,
  hasMany,
  hasOne,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { ChildV2 } from "./child_v2";

/**
 * Parent v2: Add @hasOne → Child (profileChild field)
 * Only hasMany/hasOne are on parent side — should NOT produce FK statements
 */
export class ParentV2 extends Model {
  static table = "schema_diff_parent";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @hasMany(() => ChildV2, "parentId")
  declare children: ChildV2[];

  @hasOne(() => ChildV2, "parentId")
  declare profileChild: ChildV2;
}
