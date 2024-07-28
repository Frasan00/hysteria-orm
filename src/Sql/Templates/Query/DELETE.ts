import * as sqlString from "sqlstring";
import { DataSourceType } from "../../../Datasource";

const deleteTemplate = (tableName: string, dbType: DataSourceType) => {
  return {
    delete: (column: string, value: string | number | boolean | Date) =>
      `\nDELETE FROM ${tableName} WHERE ${column} = ${sqlString.escape(
        value,
      )} `,
    massiveDelete: (whereClause: string, joinClause: string = "") => {
      let query = `DELETE FROM ${tableName} ${joinClause} ${whereClause}`;
      dbType === "postgres" && (query += " RETURNING *;");

      return query;
    },
    softDelete: (column: string, whereClause: string, joinClause: string = "", softDeleteColumn: string = "deleted_at") => {
      let query = `UPDATE ${tableName} SET ${softDeleteColumn} = TRUE ${joinClause} ${whereClause}`;
      dbType === "postgres" && (query += " RETURNING *;");

      return query;
    },
  };
};

export default deleteTemplate;
