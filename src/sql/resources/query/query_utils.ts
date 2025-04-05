import { isNestedObject } from "../../../utils/json_utils";
import { SqlDataSourceType } from "../../sql_data_source_types";

export const formatValue = (value: any, dbType: SqlDataSourceType): any => {
  switch (true) {
    case value === undefined:
    case value === null:
      return null;
    case Buffer.isBuffer(value):
      return value;
    case Array.isArray(value):
      return JSON.stringify(value);
    case isNestedObject(value) && !Buffer.isBuffer(value):
      return JSON.stringify(value);
    case value instanceof Date:
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return value.toISOString();
        case "mysql":
        case "mariadb":
          return value.toISOString().slice(0, 19).replace("T", " ");
        case "sqlite":
          return value.toISOString();
        default:
          return value;
      }
    case typeof value === "bigint":
      return value.toString();
    default:
      return value;
  }
};
