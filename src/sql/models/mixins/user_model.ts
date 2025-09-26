import { column } from "../decorators/model_decorators";
import { Model } from "../model";

/**
 * @description Mixin to add a user model with id, email, createdAt, updatedAt and deletedAt columns
 */
export class User extends Model {
  @column.integer({
    primaryKey: true,
    type: "integer",
    openApi: { type: "number", required: true },
  })
  declare id: BigInt;

  @column({
    type: "varchar",
    length: 255,
    openApi: { type: "string", required: true },
  })
  declare email: string;

  @column.date({
    autoCreate: true,
    type: "timestamp",
    openApi: { type: "string", format: "date-time", required: true },
  })
  declare createdAt: Date;

  @column.date({
    autoCreate: true,
    autoUpdate: true,
    type: "timestamp",
    openApi: { type: "string", format: "date-time", required: true },
  })
  declare updatedAt: Date;

  @column.date({
    type: "timestamp",
    openApi: { type: "string", format: "date-time", required: true },
  })
  declare deletedAt: Date | null;
}
