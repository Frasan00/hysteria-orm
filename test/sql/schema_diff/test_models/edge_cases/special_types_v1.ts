import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * SpecialTypes v1: Boolean, binary, text columns
 */
export class SpecialTypesV1 extends Model {
  static table = "schema_diff_special_types";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "boolean", default: false })
  declare flag: boolean;

  @column({ type: "binary", nullable: true })
  declare data: Buffer | null;

  @column({ type: "text" })
  declare notes: string;
}
