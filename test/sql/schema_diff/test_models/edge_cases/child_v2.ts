import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { ParentV2 } from "./parent_v2";

/**
 * Child v2: Same as v1 — belongs to Parent v2
 */
export class ChildV2 extends Model {
  static table = "schema_diff_child";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare value: string;

  @column({ type: "bigint" })
  declare parentId: number;

  @belongsTo(() => ParentV2, "parentId")
  declare parent: ParentV2;
}
