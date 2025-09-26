import { column } from "../decorators/model_decorators";
import { Model } from "../model";

/**
 * @description Mixin to add createdAt, updatedAt and deletedAt columns to a model
 */
export class TimestampedModel extends Model {
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
