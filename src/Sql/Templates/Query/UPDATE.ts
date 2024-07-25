import { camelToSnakeCase } from "../../../CaseUtils";
import * as sqlString from "sqlstring";

const updateTemplate = (table: string) => {
  return {
    update: (
      columns: string[],
      values: string[],
      primaryKey?: string,
      primaryKeyValue?: string | undefined,
    ) => {
      columns = columns.map((column) =>
        camelToSnakeCase(sqlString.escape(column)),
      );
      return `UPDATE ${table} SET ${columns
        .map((column, index) => `${column}, ${sqlString.escape(values[index])}`)
        .filter((column) => column !== undefined)
        .join(", ")} WHERE ${primaryKey} = ${primaryKeyValue};`;
    },
  };
};

export default updateTemplate;
