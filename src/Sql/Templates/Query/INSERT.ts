import { camelToSnakeCase } from "../../../CaseUtils";

type BaseValues = string | number | boolean | Date | null | undefined;

const insertTemplate = (tableName: string) => {
  return {
    insert: (columns: string[], values: BaseValues[]) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      values = parseValues(values);
      return `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES (${values.join(", ")});`;
    },
    insertMany: (columns: string[], values: string[][]) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      const parsedValues = values.map(parseValues);
      const valueSets = parsedValues.map((val) => `(${val.join(", ")})`);
      return `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES ${valueSets.join(", ")};`;
    },
  };
};

function parseValues(values: BaseValues[]) {
  return values.map((value: BaseValues) => {
    if (typeof value === "string") {
      return `'${value}'`;
    }

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    if (value === null) {
      return "NULL";
    }

    if (typeof value === "function") {
      return;
    }

    return value || "DEFAULT";
  });
}

export default insertTemplate;
