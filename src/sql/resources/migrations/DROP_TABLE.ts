import { HysteriaError } from "../../../errors/hysteria_error";
import type { SqlDataSourceType } from "../../sql_data_source_types";

const dropTableTemplate = (
  table: string,
  ifExists: boolean,
  dbType: SqlDataSourceType,
) => {
  switch (dbType) {
    case "mariadb":
    case "mysql":
      return ifExists
        ? `DROP TABLE IF EXISTS \`${table}\``
        : `DROP TABLE \`${table}\``;
    case "postgres":
      return ifExists
        ? `DROP TABLE IF EXISTS "${table}"`
        : `DROP TABLE "${table}"`;
    case "sqlite":
      return ifExists
        ? `DROP TABLE IF EXISTS "${table}"`
        : `DROP TABLE "${table}"`;
    default:
      throw new HysteriaError(
        "DropTableTemplate::dropTable",
        `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
      );
  }
};

export default dropTableTemplate;
