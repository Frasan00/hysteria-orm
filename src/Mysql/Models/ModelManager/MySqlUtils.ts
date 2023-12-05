import { RowDataPacket } from "mysql2/promise";
import { Model } from "../Model";
import { Relation } from "../Relations/Relation";

class MySqlUtils {
  public convertSqlResultToModel<T extends Model>(
    result: RowDataPacket,
    model: new () => T,
  ): T {
    const modelInstance: T = new model();
    const propertyNames: string[] = Object.getOwnPropertyNames(modelInstance);

    for (const key of propertyNames) {
      const isSpecialKey =
        Object.prototype.hasOwnProperty.call(modelInstance, key) &&
        (modelInstance[key as keyof T] instanceof Relation ||
          key === "primaryKey" ||
          key === "tableName");

      if (!isSpecialKey && Object.prototype.hasOwnProperty.call(result, key)) {
        modelInstance[key as keyof T] = result[key] as T[keyof T];
      }
    }

    return modelInstance;
  }
}

export default new MySqlUtils();
