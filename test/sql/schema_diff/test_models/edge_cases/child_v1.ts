import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { ParentV1 } from "./parent_v1";

/**
 * Child v1: Has @belongsTo → Parent
 */
export class ChildV1 extends Model {
  static table = "schema_diff_child";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare value: string;

  @column({ type: "bigint" })
  declare parentId: number;

  @belongsTo(() => ParentV1, "parentId")
  declare parent: ParentV1;
}
