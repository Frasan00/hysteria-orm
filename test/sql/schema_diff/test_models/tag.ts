import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * Tag model for manyToMany relation testing
 */
export class TagMigration extends Model {
  static table = "schema_diff_tags";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 100 })
  declare name: string;

  @column({ type: "varchar", length: 50, nullable: true })
  declare slug: string | null;
}
