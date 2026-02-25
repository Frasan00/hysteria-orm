import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * PkChange v2: bigint PK (bigIncrement)
 */
export class PkChangeV2 extends Model {
  static table = "schema_diff_pk_change";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;
}
