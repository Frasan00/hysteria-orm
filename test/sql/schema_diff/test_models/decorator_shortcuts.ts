import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

/**
 * Model specifically for testing decorator shortcuts idempotency
 * Uses @column.string(), @column.text(), etc. instead of @column({ type: "varchar" })
 * This ensures schema sync is idempotent when using decorator shortcuts
 */
export class DecoratorShortcutsModel extends Model {
  static table = "schema_diff_decorator_shortcuts";

  @column.bigIncrement()
  declare id: number;

  @column.string({ length: 100 })
  declare name: string;

  @column.string({ length: 255 })
  declare email: string;

  @column.integer()
  declare age: number;

  @column.boolean()
  declare isActive: boolean;

  @column.decimal({ precision: 10, scale: 2 })
  declare balance: number;

  @column.date()
  declare birthDate: Date;

  @column.timestamp()
  declare createdAt: Date;
}
