import { column } from "../decorators/model_decorators";
import { Model } from "../model";

/**
 * @description Mixin to add createdAt, updatedAt and deletedAt columns to a model
 */
export class TimestampedModel extends Model {
  @column.datetime({
    autoCreate: true,
    openApi: { type: "string", format: "date-time", required: true },
  })
  declare createdAt: Date;

  @column.datetime({
    autoCreate: true,
    autoUpdate: true,
    openApi: { type: "string", format: "date-time", required: true },
  })
  declare updatedAt: Date;

  @column.datetime({
    openApi: { type: "string", format: "date-time", required: true },
  })
  declare deletedAt: Date | null;
}
