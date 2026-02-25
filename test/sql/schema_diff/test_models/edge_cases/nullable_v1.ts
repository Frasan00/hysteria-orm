import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Nullable v1: Mixed nullable state
 */
export class NullableV1 extends Model {
  static table = "schema_diff_nullable";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255, nullable: false })
  declare field1: string;

  @column({ type: "varchar", length: 255, nullable: true })
  declare field2: string | null;

  @column({ type: "varchar", length: 255, nullable: false })
  declare field3: string;
}
