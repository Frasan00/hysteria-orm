import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { Model } from "../../models/model";
import { getModelColumns } from "../../models/model_decorators";
import type { SqlDataSourceType } from "../../sql_data_source_types";
import { formatValue } from "./query_utils";

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
    case "cockroachdb":
      const typeCast = Buffer.isBuffer(value)
        ? "bytea"
        : Array.isArray(value)
          ? "array"
          : typeof value === "object" &&
              value !== null &&
              !(value instanceof Date)
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
      throw new HysteriaError(
        "UpdateTemplate::getPlaceholder",
        `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
      );
  }
};

const updateTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const table = typeofModel.table;
  let modelColumns: ReturnType<typeof getModelColumns> = [];

  try {
    modelColumns = getModelColumns(typeofModel);
  } catch (error) {
    modelColumns = [];
  }

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

      const modelColumnsMap = new Map(
        modelColumns.map((modelColumn) => [
          modelColumn.columnName,
          modelColumn,
        ]),
      );

      for (let i = 0; i < values.length; i++) {
        const column = columns[i];
        const modelColumn = modelColumnsMap.get(column);

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
        case "cockroachdb":
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
          throw new HysteriaError(
            "UpdateTemplate::update",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }

      const primaryKeyPlaceholder =
        dbType === "postgres" || dbType === "cockroachdb"
          ? `$${columns.length + 1}`
          : "?";
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

      const modelColumnsMap = new Map(
        modelColumns.map((modelColumn) => [
          modelColumn.columnName,
          modelColumn,
        ]),
      );

      for (let i = 0; i < values.length; i++) {
        const column = columns[i];
        const modelColumn = modelColumnsMap.get(column);
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
        case "cockroachdb":
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
          throw new HysteriaError(
            "UpdateTemplate::massiveUpdate",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }

      const query = `UPDATE ${table} ${joinClause}
SET ${setClause} ${whereClause}`;

      return { query, params };
    },
  };
};

export default updateTemplate;
