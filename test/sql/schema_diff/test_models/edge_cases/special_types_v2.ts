import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * SpecialTypes v2: Change text→varchar, add new boolean
 */
export class SpecialTypesV2 extends Model {
  static table = "schema_diff_special_types";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "boolean", default: true })
  declare flag: boolean;

  @column({ type: "binary", nullable: true })
  declare data: Buffer | null;

  @column({ type: "varchar", length: 500 })
  declare notes: string;

  @column({ type: "boolean", default: false, nullable: true })
  declare isArchived: boolean | null;
}
