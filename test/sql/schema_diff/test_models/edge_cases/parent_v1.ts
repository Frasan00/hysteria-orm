import {
  column,
  hasMany,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { ChildV1 } from "./child_v1";

/**
 * Parent v1: Has @hasMany → Child
 */
export class ParentV1 extends Model {
  static table = "schema_diff_parent";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;

  @hasMany(() => ChildV1, "parentId")
  declare children: ChildV1[];
}
