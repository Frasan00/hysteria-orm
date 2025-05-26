import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { isNestedObject } from "../../../utils/json_utils";
import { getModelColumns } from "../../models/decorators/model_decorators";
import { Model } from "../../models/model";
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
    default:
      return "";
  }
};

const insertTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const table = typeofModel.table;
  const modelColumns = getModelColumns(typeofModel);
  const modelColumnsMap = new Map(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  return {
    insert: (columns: string[], values: BaseValues[], returning?: string[]) => {
      columns = columns.filter((column) => column !== "*");
      if (columns.includes("$annotations")) {
        const $additionalColumnsIndex = columns.indexOf("$annotations");
        columns.splice(columns.indexOf("$annotations"), 1);
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
          const preparedValue = modelColumn.prepare(values[i]);
          values[i] = preparedValue;
        }
      }

      columns = columns.map(
        (column) =>
          modelColumnsMap.get(column)?.databaseName ??
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
VALUES (${placeholders}) RETURNING ${returning && returning.length > 0 ? returning.join(", ") : "*"};`;

      return { query, params };
    },
    insertMany: (
      columns: string[],
      values: BaseValues[][],
      returning?: string[],
    ) => {
      if (columns.includes("$annotations")) {
        const $additionalColumnsIndex = columns.indexOf("$annotations");
        columns.splice(columns.indexOf("$annotations"), 1);
        values.splice($additionalColumnsIndex, 1);
      }

      columns = columns.filter((column) => column !== "*");
      let valueSets: string[];
      let params: BaseValues[] = [];

      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          const column = columns[j];
          const modelColumn = modelColumnsMap.get(column);
          if (modelColumn && modelColumn.prepare) {
            const preparedValue = modelColumn.prepare(values[i][j]);
            values[i][j] = preparedValue;
          }
        }
      }

      columns = columns.map(
        (column) =>
          modelColumnsMap.get(column)?.databaseName ??
          convertCase(column, typeofModel.databaseCaseConvention),
      );
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
VALUES ${valueSets.join(", ")} RETURNING ${returning && returning.length > 0 ? returning.join(", ") : "*"};`;

      return { query, params };
    },
    onDuplicate(
      mode: "update" | "ignore",
      conflictColumns: string[],
      columnsToUpdate: string[],
      returning?: string[],
    ): { query: string; params: any[] } {
      conflictColumns = conflictColumns.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );
      columnsToUpdate = columnsToUpdate.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          if (mode === "ignore") {
            return {
              query: `ON CONFLICT (${conflictColumns.join(", ")}) DO NOTHING`,
              params: [],
            };
          }

          const updateSet = columnsToUpdate
            .map((column) => `${column} = EXCLUDED.${column}`)
            .join(", ");

          return {
            query: `ON CONFLICT (${conflictColumns.join(", ")}) DO UPDATE SET ${updateSet} RETURNING ${returning && returning.length > 0 ? returning.join(", ") : "*"}`,
            params: [],
          };
        case "mysql":
        case "mariadb":
          if (mode === "ignore") {
            return {
              query: `ON DUPLICATE KEY IGNORE`,
              params: [],
            };
          }

          const mysqlUpdateSet = columnsToUpdate
            .map((column) => `${column} = new.${column}`)
            .join(", ");
          return {
            query: ` AS new ON DUPLICATE KEY UPDATE ${mysqlUpdateSet}`,
            params: [],
          };
        case "sqlite":
          if (mode === "ignore") {
            return {
              query: `ON CONFLICT (${conflictColumns.join(", ")}) DO NOTHING`,
              params: [],
            };
          }

          const sqliteUpdateSet = columnsToUpdate
            .map((column) => `${column} = excluded.${column}`)
            .join(", ");
          return {
            query: `ON CONFLICT (${conflictColumns.join(", ")}) DO UPDATE SET ${sqliteUpdateSet}`,
            params: [],
          };
        default:
          throw new HysteriaError(
            "InsertTemplate::onDuplicate",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
  };
};

export default insertTemplate;
