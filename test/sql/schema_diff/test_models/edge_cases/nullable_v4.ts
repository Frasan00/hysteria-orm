import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Nullable v4: All nullable
 */
export class NullableV4 extends Model {
  static table = "schema_diff_nullable";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255, nullable: true })
  declare field1: string | null;

  @column({ type: "varchar", length: 255, nullable: true })
  declare field2: string | null;

  @column({ type: "varchar", length: 255, nullable: true })
  declare field3: string | null;
}
