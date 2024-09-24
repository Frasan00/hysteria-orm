import { DateTime } from "luxon";
import { convertCase } from "../../../CaseUtils";
import { SqlDataSourceType } from "../../../Datasource";
import { isNestedObject } from "../../jsonUtils";
import { Model } from "../../Models/Model";

type BaseValues =
  | string
  | number
  | boolean
  | Date
  | null
  | object
  | undefined
  | DateTime;

const insertTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const table = typeofModel.table;
  return {
    insert: (columns: string[], values: BaseValues[]) => {
      columns = columns.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );
      let placeholders: string;
      let params: BaseValues[];

      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
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
        dbType === "mysql"
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

      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
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
        dbType === "mysql"
          ? `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")};`
          : `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")} RETURNING *;`;

      return { query, params };
    },
  };
};

export default insertTemplate;
