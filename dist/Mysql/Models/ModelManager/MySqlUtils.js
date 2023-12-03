"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MySqlUtils {
    convertSqlResultToModel(result, model) {
        const modelInstance = new model();
        const propertyNames = Object.getOwnPropertyNames(modelInstance);
        for (const key of propertyNames) {
            if (Object.prototype.hasOwnProperty.call(result, key)) {
                modelInstance[key] = result[key];
            }
        }
        return modelInstance;
    }
}
exports.default = new MySqlUtils();
