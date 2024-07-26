import { camelToSnakeCase } from "../../../CaseUtils";
import * as sqlString from "sqlstring";
import { DataSourceType } from "../../Datasource";

type BaseValues = string | number | boolean | Date | null | undefined;

const insertTemplate = (tableName: string, dbType: DBType) => {
  return {
    insert: (columns: string[], values: BaseValues[]) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      let placeholders: string;
      let params: BaseValues[];

      switch (dbType) {
        case "mysql":
          placeholders = columns.map(() => "?").join(", ");
          params = values;
          break;
        case "postgres":
          placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
          params = values;
          break;
        default:
          throw new Error("Unsupported database type");
      }

      const query = `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES (${placeholders});`;

      return { query, params };
    },
    insertMany: (columns: string[], values: BaseValues[][]) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      let valueSets: string[];
      let params: BaseValues[] = [];

      switch (dbType) {
        case "mysql":
          valueSets = values.map((valueSet) => {
            params.push(...valueSet);
            return `(${valueSet.map(() => "?").join(", ")})`;
          });
          break;
        case "postgres":
          valueSets = values.map((valueSet, rowIndex) => {
            params.push(...valueSet);
            return `(${valueSet
              .map(
                (_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`,
              )
              .join(", ")})`;
          });
          break;
        default:
          throw new Error("Unsupported database type");
      }

      const query = `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES ${valueSets.join(", ")};`;

      return { query, params };
    },
  };
};

export default insertTemplate;
