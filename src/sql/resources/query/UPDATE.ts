import { convertCase } from "../../../utils/case_utils";
import { isNestedObject } from "../../../utils/json_utils";
import { Model } from "../../models/model";
import { getModelColumns } from "../../models/model_decorators";
import type { SqlDataSourceType } from "../../sql_data_source_types";

const isArray = (value: any): value is Array<any> => Array.isArray(value);

const formatValue = (value: any, dbType: SqlDataSourceType): any => {
  if (value === undefined) return null;
  if (value === null) return null;

  if (isArray(value)) {
    return JSON.stringify(value);
  }

  if (isNestedObject(value) && !Buffer.isBuffer(value)) {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    if (dbType === "postgres") {
      return value.toISOString();
    }
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  return value;
};

const getPlaceholder = (
  value: any,
  index: number,
  dbType: SqlDataSourceType,
): string => {
  switch (dbType) {
    case "mysql":
    case "mariadb":
      if (Buffer.isBuffer(value)) return "BINARY(?)";
      if (value instanceof Date)
        return "STR_TO_DATE(?, '%Y-%m-%dT%H:%i:%s.%fZ')";
      return "?";
    case "sqlite":
      return "?";
    case "postgres":
      const typeCast = Buffer.isBuffer(value)
        ? "bytea"
        : isArray(value)
          ? "array"
          : isNestedObject(value)
            ? "jsonb"
            : typeof value === "boolean"
              ? "boolean"
              : typeof value === "bigint"
                ? "bigint"
                : value instanceof Date
                  ? "timestamp"
                  : "";
      return typeCast ? `$${index + 1}::${typeCast}` : `$${index + 1}`;
    default:
      throw new Error("Unsupported database type");
  }
};

const updateTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const table = typeofModel.table;
  const modelColumns = getModelColumns(typeofModel);

  return {
    update: (
      columns: string[],
      values: any[],
      primaryKey?: string,
      primaryKeyValue?: string | undefined,
    ) => {
      if (columns.includes("$additional")) {
        const $additionalColumnsIndex = columns.indexOf("$additional");
        columns.splice(columns.indexOf("$additional"), 1);
        values.splice($additionalColumnsIndex, 1);
      }

      for (let i = 0; i < values.length; i++) {
        const column = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn) => modelColumn.columnName === column,
        );
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }

      columns = columns.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );

      let setClause: string;
      let params: any[];

      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns
            .map((column, index) => {
              return `${column} = ${getPlaceholder(values[index], index, dbType)}`;
            })
            .join(", ");
          params = [
            ...values.map((v) => formatValue(v, dbType)),
            primaryKeyValue,
          ];
          break;
        case "postgres":
          setClause = columns
            .map((column, index) => {
              return `${column} = ${getPlaceholder(values[index], index, dbType)}`;
            })
            .join(", ");
          params = [
            ...values.map((v) => formatValue(v, dbType)),
            primaryKeyValue,
          ];
          break;
        default:
          throw new Error("Unsupported database type");
      }

      const primaryKeyPlaceholder =
        dbType === "postgres" ? `$${columns.length + 1}` : "?";
      const query = `UPDATE ${table}
SET ${setClause}
WHERE ${primaryKey} = ${primaryKeyPlaceholder};`;

      return { query, params };
    },

    massiveUpdate: (
      columns: string[],
      values: any[],
      whereClause: string,
      joinClause: string = "",
    ) => {
      columns = columns.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );

      if (columns.includes("$additional")) {
        const $additionalColumnsIndex = columns.indexOf("$additional");
        columns.splice(columns.indexOf("$additional"), 1);
        values.splice($additionalColumnsIndex, 1);
      }

      for (let i = 0; i < values.length; i++) {
        const column = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn) => modelColumn.columnName === column,
        );
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }

      let setClause: string;
      const params: any[] = [];

      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns
            .map((column, index) => {
              return `${column} = ${getPlaceholder(values[index], index, dbType)}`;
            })
            .join(", ");
          values.forEach((value) => {
            params.push(formatValue(value, dbType));
          });
          break;
        case "postgres":
          setClause = columns
            .map((column, index) => {
              return `${column} = ${getPlaceholder(values[index], index, dbType)}`;
            })
            .join(", ");
          values.forEach((value) => {
            params.push(formatValue(value, dbType));
          });
          break;
        default:
          throw new Error("Unsupported database type");
      }

      const query = `UPDATE ${table} ${joinClause}
SET ${setClause} ${whereClause}`;

      return { query, params };
    },
  };
};

export default updateTemplate;
