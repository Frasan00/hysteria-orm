import { convertCase } from "../../../utils/case_utils";
import { isNestedObject } from "../../../utils/json_utils";
import { Model } from "../../models/model";
import { getModelColumns } from "../../models/model_decorators";
import type { SqlDataSourceType } from "../../sql_data_source_types";

type BaseValues = string | number | boolean | Date | null | object | undefined;

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
              if (isNestedObject(values[index])) {
                return `?`;
              }
              return `?`;
            })
            .join(", ");
          params = values.map((value) =>
            isNestedObject(value) ? JSON.stringify(value) : value,
          );
          break;
        case "sqlite":
          placeholders = columns.map(() => "?").join(", ");
          params = values;
          break;
        case "postgres":
          placeholders = columns
            .map((_, index) => {
              if (isNestedObject(values[index])) {
                return `$${index + 1}::jsonb`;
              }
              return `$${index + 1}`;
            })
            .join(", ");
          params = values.map((value) =>
            isNestedObject(value) ? JSON.stringify(value) : value,
          );
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
            params.push(
              ...valueSet.map((value) =>
                isNestedObject(value) ? JSON.stringify(value) : value,
              ),
            );
            return `(${valueSet.map(() => "?").join(", ")})`;
          });
          break;
        case "sqlite":
          valueSets = values.map((valueSet) => {
            params.push(...valueSet);
            return `(${valueSet.map(() => "?").join(", ")})`;
          });
          break;
        case "postgres":
          valueSets = values.map((valueSet, rowIndex) => {
            params.push(
              ...valueSet.map((value) =>
                isNestedObject(value) ? JSON.stringify(value) : value,
              ),
            );
            return `(${valueSet
              .map((value, colIndex) => {
                if (isNestedObject(value)) {
                  return `$${rowIndex * columns.length + colIndex + 1}::jsonb`;
                }
                return `$${rowIndex * columns.length + colIndex + 1}`;
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
