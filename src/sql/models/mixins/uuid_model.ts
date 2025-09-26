import { column } from "../decorators/model_decorators";
import { Model } from "../model";

/**
 * @description Mixin to add a uuid column to a model
 */
export class UuidModel extends Model {
  @column.uuid({
    type: "uuid",
    primaryKey: true,
    openApi: { type: "string", format: "uuid", required: true },
  })
  declare id: string;
}
