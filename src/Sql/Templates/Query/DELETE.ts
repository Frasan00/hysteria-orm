import * as sqlString from "sqlstring";

const deleteTemplate = (tableName: string) => {
  return {
    delete: (column: string, value: string | number | boolean | Date) =>
      `\nDELETE FROM ${tableName} WHERE ${column} = ${sqlString.escape(
        value,
      )} `,
  };
};

export default deleteTemplate;
