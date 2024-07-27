import { camelToSnakeCase } from "../../../CaseUtils";
import * as sqlString from "sqlstring";
import { DataSourceType } from "../../../Datasource";

const updateTemplate = (table: string, dbType: DataSourceType) => {
  return {
    update: (
      columns: string[],
      values: string[],
      primaryKey?: string,
      primaryKeyValue?: string | undefined,
    ) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      let setClause: string;
      let params: (string | undefined)[];

      switch (dbType) {
        case "mysql":
          setClause = columns.map((column) => `\`${column}\` = ?`).join(", ");
          params = [...values, primaryKeyValue];
          break;
        case "postgres":
          setClause = columns
            .map((column, index) => `"${column}" = $${index + 1}`)
            .join(", ");
          params = [...values, primaryKeyValue];
          break;
        default:
          throw new Error("Unsupported database type");
      }

      const query = `UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ${
        dbType === "mysql" ? "?" : `$${columns.length + 1}`
      };`;

      return { query, params };
    },
  };
};

export default updateTemplate;
