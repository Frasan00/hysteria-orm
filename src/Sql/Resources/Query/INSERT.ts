import { camelToSnakeCase } from "../../../CaseUtils";
import { DataSourceType } from "../../../Datasource";
import { isNestedObject } from "../../jsonUtils";

type BaseValues = string | number | boolean | Date | null | object | undefined;

const insertTemplate = (tableName: string, dbType: DataSourceType) => {
  return {
    insert: (columns: string[], values: BaseValues[]) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      let placeholders: string;
      let params: BaseValues[];

      switch (dbType) {
        case "mysql":
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
        dbType === "mysql" || dbType === "mariadb"
          ? `INSERT INTO ${tableName} (${columns.join(", ")})
             VALUES (${placeholders});`
          : `INSERT INTO ${tableName} (${columns.join(", ")})
             VALUES (${placeholders}) RETURNING *;`;

      return { query, params };
    },
    insertMany: (columns: string[], values: BaseValues[][]) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      let valueSets: string[];
      let params: BaseValues[] = [];

      switch (dbType) {
        case "mysql":
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
          ? `INSERT INTO ${tableName} (${columns.join(", ")})
             VALUES ${valueSets.join(", ")};`
          : `INSERT INTO ${tableName} (${columns.join(", ")})
             VALUES ${valueSets.join(", ")} RETURNING *;`;

      return { query, params };
    },
  };
};

export default insertTemplate;
