import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * TypeChange v1: Columns with initial types
 */
export class TypeChangeV1 extends Model {
  static table = "schema_diff_type_change";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "integer" })
  declare count: number;

  @column({ type: "varchar", length: 100 })
  declare price: string;

  @column({ type: "varchar", length: 50 })
  declare status: string;
}
