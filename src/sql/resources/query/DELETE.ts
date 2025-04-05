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
  };
};

export default deleteTemplate;
