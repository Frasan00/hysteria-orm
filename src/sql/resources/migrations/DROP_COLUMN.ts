import { HysteriaError } from "../../../errors/hysteria_error";
import type { SqlDataSourceType } from "../../sql_data_source_types";

export const dropColumnForce = (table: string, dbType: SqlDataSourceType) => {
  switch (dbType) {
    case "mariadb":
    case "mysql":
      return `SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS \`${table}\`;
SET FOREIGN_KEY_CHECKS = 1;`;
    case "postgres":
      return `DROP TABLE IF EXISTS "${table}" CASCADE;`;
    case "sqlite":
      return `DROP TABLE IF EXISTS "${table}";`;
    default:
      throw new HysteriaError(
        "DropColumnTemplate::dropColumn",
        `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
      );
  }
};
