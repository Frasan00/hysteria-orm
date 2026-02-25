import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Large v1: 20+ columns of various types
 */
export class LargeV1 extends Model {
  static table = "schema_diff_large";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 100 })
  declare col1: string;

  @column({ type: "varchar", length: 255 })
  declare col2: string;

  @column({ type: "text", nullable: true })
  declare col3: string | null;

  @column({ type: "integer" })
  declare col4: number;

  @column({ type: "bigint" })
  declare col5: number;

  @column({ type: "boolean", default: false })
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

  @column({ type: "varchar", length: 50, default: "pending" })
  declare col12: string;

  @column({ type: "integer", default: 0 })
  declare col13: number;

  @column({ type: "varchar", length: 500, nullable: true })
  declare col14: string | null;

  @column({ type: "boolean", default: true })
  declare col15: boolean;

  @column({ type: "varchar", length: 36, nullable: true })
  declare col16: string | null;

  @column({ type: "integer", nullable: true })
  declare col17: number | null;

  @column({ type: "varchar", length: 100, nullable: true })
  declare col18: string | null;

  @column({ type: "bigint", nullable: true })
  declare col19: number | null;

  @column({ type: "varchar", length: 255, nullable: true })
  declare col20: string | null;
}
