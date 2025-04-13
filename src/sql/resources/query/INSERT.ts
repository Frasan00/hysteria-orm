import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { isNestedObject } from "../../../utils/json_utils";
import { Model } from "../../models/model";
import { getModelColumns } from "../../models/model_decorators";
import type { SqlDataSourceType } from "../../sql_data_source_types";
import { formatValue } from "./query_utils";

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

const getPostgresTypeCast = (value: BaseValues): string => {
  switch (true) {
    case Buffer.isBuffer(value):
      return "bytea";
    case Array.isArray(value):
      return "array";
    case isNestedObject(value):
      return "jsonb";
    case typeof value === "boolean":
      return "boolean";
    case typeof value === "bigint":
      return "bigint";
    case value instanceof Date:
      return "timestamp";
    default:
      return "";
  }
};

const insertTemplate = (
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
    insert: (columns: string[], values: BaseValues[], returning?: string[]) => {
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
              if (Array.isArray(value) || isNestedObject(value)) {
                return `?`;
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
        case "cockroachdb":
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
          throw new HysteriaError(
            "InsertTemplate::insert",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }

      const query =
        dbType !== "postgres" && dbType !== "cockroachdb"
          ? `INSERT INTO ${table} (${columns.join(", ")})
VALUES (${placeholders});`
          : `INSERT INTO ${table} (${columns.join(", ")})
VALUES (${placeholders}) RETURNING ${returning ? returning.join(", ") : "*"};`;

      return { query, params };
    },
    insertMany: (
      columns: string[],
      values: BaseValues[][],
      returning?: string[],
    ) => {
      columns = columns.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );
      let valueSets: string[];
      let params: BaseValues[] = [];

      const modelColumnsMap = new Map(
        modelColumns.map((modelColumn) => [
          modelColumn.columnName,
          modelColumn,
        ]),
      );

      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          const column = columns[j];
          const modelColumn = modelColumnsMap.get(column);
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
        case "cockroachdb":
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
          throw new HysteriaError(
            "InsertTemplate::insertMany",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }

      const query =
        dbType !== "postgres" && dbType !== "cockroachdb"
          ? `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")};`
          : `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")} RETURNING ${returning ? returning.join(", ") : "*"};`;

      return { query, params };
    },
  };
};

export default insertTemplate;
