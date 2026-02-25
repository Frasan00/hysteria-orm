import {
  belongsTo,
  column,
} from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * MultiFk v1: Two FKs to same User table
 * Uses a simple "anchor" table for the FK target
 */
export class MultiFkAnchor extends Model {
  static table = "schema_diff_mfk_anchor";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;
}

export class MultiFkV1 extends Model {
  static table = "schema_diff_mfk";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare title: string;

  @column({ type: "bigint" })
  declare createdById: number;

  @column({ type: "bigint" })
  declare updatedById: number;

  @belongsTo(() => MultiFkAnchor, "createdById")
  declare createdBy: MultiFkAnchor;

  @belongsTo(() => MultiFkAnchor, "updatedById")
  declare updatedBy: MultiFkAnchor;
}
