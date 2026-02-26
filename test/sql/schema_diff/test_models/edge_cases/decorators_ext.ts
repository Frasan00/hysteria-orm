import { column } from "../../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../../src/sql/models/model";

/**
 * Extended Decorator Shortcuts — all shortcut types for idempotency testing
 */
export class DecoratorsExtModel extends Model {
  static table = "schema_diff_decorators_ext";

  @column.bigIncrement()
  declare id: number;

  @column.string({ length: 150 })
  declare strCol: string;

  @column.text({ nullable: true })
  declare textCol: string | null;

  @column.integer()
  declare intCol: number;

  @column.bigInteger({ nullable: true })
  declare bigintCol: number | null;

  @column.float({ nullable: true })
  declare floatCol: number | null;

  @column.decimal({ precision: 12, scale: 3 })
  declare decCol: number;

  @column.boolean({ default: false })
  declare boolCol: boolean;

  @column.json({ nullable: true })
  declare jsonCol: Record<string, unknown> | null;

  @column.date({ nullable: true })
  declare dateCol: Date | null;

  @column.datetime({ nullable: true })
  declare datetimeCol: Date | null;

  @column.timestamp({ nullable: true })
  declare tsCol: Date | null;

  @column.time({ nullable: true })
  declare timeCol: string | null;

  @column.binary({ nullable: true })
  declare binCol: Buffer | null;

  @column.uuid({ nullable: true })
  declare uuidCol: string | null;
}
