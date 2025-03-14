import { convertCase } from "../../../utils/case_utils";
import { isNestedObject } from "../../../utils/json_utils";
import { Model } from "../../models/model";
import { getModelColumns } from "../../models/model_decorators";
import type { SqlDataSourceType } from "../../sql_data_source_types";

type BaseValues =
  | string
  | number
  | boolean
  | Date
  | null
  | object
  | undefined
  | Buffer
  | bigint
  | Array<any>;

const isArray = (value: any): value is Array<any> => Array.isArray(value);

const getPostgresTypeCast = (value: BaseValues): string => {
  if (Buffer.isBuffer(value)) return "bytea";
  if (isArray(value)) return "array";
  if (isNestedObject(value)) return "jsonb";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "bigint") return "bigint";
  if (value instanceof Date) return "timestamp";
  return "";
};

const formatValue = (
  value: BaseValues,
  dbType: SqlDataSourceType,
): BaseValues => {
  if (value === undefined || value === null) {
    return null;
  }

  if (isArray(value)) {
    if (dbType === "postgres") {
      return JSON.stringify(value);
    }

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

const insertTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const table = typeofModel.table;
  const modelColumns = getModelColumns(typeofModel);

  return {
    insert: (columns: string[], values: BaseValues[]) => {
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
      let placeholders: string;
      let params: BaseValues[];

      switch (dbType) {
        case "mysql":
        case "mariadb":
          placeholders = columns
            .map((_, index) => {
              const value = values[index];
              if (Buffer.isBuffer(value)) {
                return `BINARY(?)`;
              }
              if (isArray(value) || isNestedObject(value)) {
                return `?`;
              }
              if (value instanceof Date) {
                return `STR_TO_DATE(?, '%Y-%m-%dT%H:%i:%s.%fZ')`;
              }
              return `?`;
            })
            .join(", ");
          params = values.map((value) => formatValue(value, dbType));
          break;
        case "sqlite":
          placeholders = columns.map(() => "?").join(", ");
          params = values.map((value) => formatValue(value, dbType));
          break;
        case "postgres":
          placeholders = columns
            .map((_, index) => {
              const value = values[index];
              const typeCast = getPostgresTypeCast(value);
              return typeCast ? `$${index + 1}::${typeCast}` : `$${index + 1}`;
            })
            .join(", ");
          params = values.map((value) => formatValue(value, dbType));
          break;
        default:
          throw new Error("Unsupported database type");
      }

      const query =
        dbType !== "postgres"
          ? `INSERT INTO ${table} (${columns.join(", ")})
VALUES (${placeholders});`
          : `INSERT INTO ${table} (${columns.join(", ")})
VALUES (${placeholders}) RETURNING *;`;

      return { query, params };
    },
    insertMany: (columns: string[], values: BaseValues[][]) => {
      columns = columns.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );
      let valueSets: string[];
      let params: BaseValues[] = [];

      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          const column = columns[j];
          const modelColumn = modelColumns.find(
            (modelColumn) => modelColumn.columnName === column,
          );
          if (modelColumn && modelColumn.prepare) {
            values[i][j] = modelColumn.prepare(values[i][j]);
          }
        }
      }

      switch (dbType) {
        case "mysql":
        case "mariadb":
          valueSets = values.map((valueSet) => {
            params.push(...valueSet.map((value) => formatValue(value, dbType)));
            return `(${valueSet
              .map((value) => {
                if (Buffer.isBuffer(value)) {
                  return "BINARY(?)";
                }
                if (value instanceof Date) {
                  return "STR_TO_DATE(?, '%Y-%m-%dT%H:%i:%s.%fZ')";
                }
                return "?";
              })
              .join(", ")})`;
          });
          break;
        case "sqlite":
          valueSets = values.map((valueSet) => {
            params.push(...valueSet.map((value) => formatValue(value, dbType)));
            return `(${valueSet.map(() => "?").join(", ")})`;
          });
          break;
        case "postgres":
          valueSets = values.map((valueSet, rowIndex) => {
            params.push(...valueSet.map((value) => formatValue(value, dbType)));
            return `(${valueSet
              .map((value, colIndex) => {
                const typeCast = getPostgresTypeCast(value);
                const paramIndex = rowIndex * columns.length + colIndex + 1;
                return typeCast
                  ? `$${paramIndex}::${typeCast}`
                  : `$${paramIndex}`;
              })
              .join(", ")})`;
          });
          break;
        default:
          throw new Error("Unsupported database type");
      }

      const query =
        dbType !== "postgres"
          ? `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")};`
          : `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")} RETURNING *;`;

      return { query, params };
    },
  };
};

export default insertTemplate;
