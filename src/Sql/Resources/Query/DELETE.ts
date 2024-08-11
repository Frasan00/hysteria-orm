import { DataSourceType } from "../../../Datasource";

const deleteTemplate = (tableName: string, dbType: DataSourceType) => {
  return {
    delete: (column: string, value: string | number | boolean | Date) =>
      `\nDELETE FROM ${tableName} WHERE ${column} = ${value} `,
    massiveDelete: (whereClause: string, joinClause: string = "") => {
      let query = `DELETE FROM ${tableName} ${joinClause} ${whereClause}`;
      dbType === "postgres" && (query += " RETURNING *;");

      return query;
    },
  };
};

export default deleteTemplate;
