import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Large v2: Modify 5 cols, add 3, drop 2
 * - Modify: col1 length 100→200, col4 integer→bigint, col6 default→true,
 *           col12 default 'pending'→'active', col15 default true→false
 * - Add: col21, col22, col23
 * - Drop: col19, col20 (removed from model)
 */
export class LargeV2 extends Model {
  static table = "schema_diff_large";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 200 })
  declare col1: string;

  @column({ type: "varchar", length: 255 })
  declare col2: string;

  @column({ type: "text", nullable: true })
  declare col3: string | null;

  @column({ type: "bigint" })
  declare col4: number;

  @column({ type: "bigint" })
  declare col5: number;

  @column({ type: "boolean", default: true })
  declare col6: boolean;

  @column({ type: "decimal", precision: 10, scale: 2 })
  declare col7: number;

  @column({ type: "float", nullable: true })
  declare col8: number | null;

  @column.json({ nullable: true })
  declare col9: Record<string, unknown> | null;

  @column({ type: "date", nullable: true })
  declare col10: Date | null;

  @column({ type: "timestamp", nullable: true })
  declare col11: Date | null;

  @column({ type: "varchar", length: 50, default: "active" })
  declare col12: string;

  @column({ type: "integer", default: 0 })
  declare col13: number;

  @column({ type: "varchar", length: 500, nullable: true })
  declare col14: string | null;

  @column({ type: "boolean", default: false })
  declare col15: boolean;

  @column({ type: "varchar", length: 36, nullable: true })
  declare col16: string | null;

  @column({ type: "integer", nullable: true })
  declare col17: number | null;

  @column({ type: "varchar", length: 100, nullable: true })
  declare col18: string | null;

  // col19 and col20 REMOVED (dropped)

  @column({ type: "varchar", length: 255, nullable: true })
  declare col21: string | null;

  @column({ type: "integer", default: 99 })
  declare col22: number;

  @column({ type: "boolean", default: false, nullable: true })
  declare col23: boolean | null;
}
