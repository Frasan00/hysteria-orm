import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Nullable v2: Flip field1→nullable, field2→NOT NULL
 */
export class NullableV2 extends Model {
  static table = "schema_diff_nullable";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255, nullable: true })
  declare field1: string | null;

  @column({ type: "varchar", length: 255, nullable: false })
  declare field2: string;

  @column({ type: "varchar", length: 255, nullable: false })
  declare field3: string;
}
