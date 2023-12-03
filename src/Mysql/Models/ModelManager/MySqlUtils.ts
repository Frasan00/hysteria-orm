import { RowDataPacket } from "mysql2/promise";
import { Model } from "../Model";
import { Relation } from "../Relations/Relation";

class MySqlUtils {
  public convertSqlResultToModel<T extends Model>(
    result: RowDataPacket,
    model: new () => T,
  ): T {
    const modelInstance = new model();
    const propertyNames = Object.getOwnPropertyNames(modelInstance);

    for (const key of propertyNames) {
      // Checks if we the models property an instance of is a Relation
      if (
        Object.prototype.hasOwnProperty.call(modelInstance, key) &&
        modelInstance[key as keyof T] instanceof Relation
      ) {
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(result, key)) {
        modelInstance[key as keyof T] = result[key] as any;
      }
    }

    return modelInstance;
  }
}

export default new MySqlUtils();
