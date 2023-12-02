import { RowDataPacket } from "mysql2/promise";
import { Model } from "../Model";

class MySqlUtils {
  public convertSqlResultToModel<T extends Model>(
    result: RowDataPacket,
    model: new () => T,
  ): T {
    const modelInstance = new model();

    for (const key in modelInstance) {
      if (
        Object.prototype.hasOwnProperty.call(modelInstance, key) &&
        result.hasOwnProperty(key)
      ) {
        modelInstance[key] = result[key] as T[Extract<keyof T, string>];
      }
    }

    return modelInstance;
  }
}

export default new MySqlUtils();
