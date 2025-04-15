import { HysteriaError } from "../../../errors/hysteria_error";
import type { SqlDataSourceType } from "../../sql_data_source_types";

const deleteTemplate = (dbType: SqlDataSourceType) => {
  return {
    delete: (
      table: string,
      column: string,
      value: string | number | boolean | Date,
    ) => {
      let baseQuery = `DELETE FROM ${table} WHERE ${column} = PLACEHOLDER`;
      switch (dbType) {
        case "mariadb":
        case "sqlite":
        case "mysql":
          baseQuery = baseQuery.replace("PLACEHOLDER", "?");
          break;
        case "postgres":
        case "cockroachdb":
          baseQuery = baseQuery.replace("PLACEHOLDER", "$1");
          break;
        default:
          throw new HysteriaError(
            "DeleteTemplate::delete",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }

      return { query: baseQuery, params: [value] };
    },
    massiveDelete: (
      table: string,
      whereClause: string,
      joinClause: string = "",
    ) => {
      return `DELETE FROM ${table} ${joinClause} ${whereClause}`;
    },
    truncate: (table: string, force: boolean): string[] => {
      const queries: string[] = [];
      switch (dbType) {
        case "sqlite":
          queries.push(`DELETE FROM ${table};`);
          break;
        case "mariadb":
        case "mysql":
          force && queries.push(`SET FOREIGN_KEY_CHECKS = 0;`);
          queries.push(`TRUNCATE TABLE ${table}`);
          force && queries.push(`SET FOREIGN_KEY_CHECKS = 1;`);
          break;
        case "postgres":
        case "cockroachdb":
          queries.push(`TRUNCATE TABLE ${table} ${force ? " CASCADE " : ""}`);
          break;
        default:
          throw new HysteriaError(
            "DeleteTemplate::delete",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }

      return queries;
    },
  };
};

export default deleteTemplate;
