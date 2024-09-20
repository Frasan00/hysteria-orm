import { DataSourceType } from "../../../Datasource";

const deleteTemplate = (table: string, dbType: DataSourceType) => {
  return {
    delete: (column: string, value: string | number | boolean | Date) => {
      let baseQuery = `DELETE FROM ${table} WHERE ${column} = PLACEHOLDER`;
      switch (dbType) {
        case "mariadb":
        case "mysql":
          baseQuery = baseQuery.replace("PLACEHOLDER", "?");
          break;
        case "postgres":
          baseQuery = baseQuery.replace("PLACEHOLDER", "$1");
          break;
        default:
          throw new Error("Unsupported database type");
      }

      return { query: baseQuery, params: [value] };
    },
    massiveDelete: (whereClause: string, joinClause: string = "") => {
      let query = `DELETE FROM ${table} ${joinClause} ${whereClause}`;
      dbType === "postgres" && (query += " RETURNING *;");

      return query;
    },
  };
};

export default deleteTemplate;
