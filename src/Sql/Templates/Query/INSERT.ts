import { camelToSnakeCase } from "../../../CaseUtils";
import * as sqlString from "sqlstring";

type BaseValues = string | number | boolean | Date | null | undefined;

const insertTemplate = (tableName: string) => {
  return {
    insert: (columns: string[], values: BaseValues[]) => {
      columns = columns.map((column) => camelToSnakeCase(sqlString.escape(column)));
      values = parseValues(values);
      return `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES (${values.join(", ")});`;
    },
    insertMany: (columns: string[], values: string[][]) => {
      columns = columns.map((column) => camelToSnakeCase(sqlString.escape(column)));
      const parsedValues = values.map(parseValues);
      const valueSets = parsedValues.map((val) => `(${val.join(", ")})`);
      return `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES ${valueSets.join(", ")};`;
    },
  };
};

function parseValues(values: BaseValues[]) {
  return values.map((value: BaseValues) => sqlString.escape(value));
}

export default insertTemplate;
