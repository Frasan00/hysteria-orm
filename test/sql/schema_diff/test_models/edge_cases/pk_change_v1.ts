import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * PkChange v1: integer PK (increment)
 */
export class PkChangeV1 extends Model {
  static table = "schema_diff_pk_change";

  @column.increment()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare name: string;
}
