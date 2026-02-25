import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";
import { MultiFkAnchor } from "./multi_fk_v1";

/**
 * MultiFk v2: Third FK + onDelete cascade on one
 */
export class MultiFkV2 extends Model {
  static table = "schema_diff_mfk";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare title: string;

  @column({ type: "bigint" })
  declare createdById: number;

  @column({ type: "bigint" })
  declare updatedById: number;

  @column({ type: "bigint", nullable: true })
  declare approvedById: number | null;

  @belongsTo(() => MultiFkAnchor, "createdById", { onDelete: "cascade" })
  declare createdBy: MultiFkAnchor;

  @belongsTo(() => MultiFkAnchor, "updatedById")
  declare updatedBy: MultiFkAnchor;

  @belongsTo(() => MultiFkAnchor, "approvedById")
  declare approvedBy: MultiFkAnchor;
}
