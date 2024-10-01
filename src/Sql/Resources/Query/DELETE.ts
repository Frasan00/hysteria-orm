import { SqlDataSourceType } from "../../../Datasource";

const deleteTemplate = (table: string, dbType: SqlDataSourceType) => {
  return {
    delete: (column: string, value: string | number | boolean | Date) => {
      let baseQuery = `DELETE FROM ${table} WHERE ${column} = PLACEHOLDER`;
      switch (dbType) {
        case "mariadb":
        case "sqlite":
        case "mysql":
          baseQuery = baseQuery.replace("PLACEHOLDER", "?");
          break;
        case "postgres":
          baseQuery = baseQuery.replace("PLACEHOLDER", "$1");
          break;
        case "mssql":
          baseQuery = baseQuery.replace("PLACEHOLDER", `@${column}`);
          break;
        default:
          throw new Error("Unsupported database type");
      }

      return { query: baseQuery, params: [value] };
    },
    massiveDelete: (whereClause: string, joinClause: string = "") => {
      return `DELETE FROM ${table} ${joinClause} ${whereClause}`;
    },
  };
};

export default deleteTemplate;
