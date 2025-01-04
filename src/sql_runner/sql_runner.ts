import { format } from "sql-formatter";
import {
  MysqlConnectionInstance,
  PgClientInstance,
  SqlConnectionType,
  SqlDataSourceType,
} from "../sql/sql_data_source_types";
import { log } from "../utils/logger";

export function getSqlDialect(
  sqlType: SqlDataSourceType,
): "mysql" | "postgresql" | "sqlite" | "mariadb" | "sql" {
  switch (sqlType) {
    case "mysql":
      return "mysql";

    case "mariadb":
      return "mariadb";

    case "postgres":
      return "postgresql";

    case "sqlite":
      return "sqlite";

    default:
      return "sql";
  }
}

export async function execSql(
  query: string,
  params: any[],
  sqlType: SqlDataSourceType,
  sqlDriver: SqlConnectionType,
  logs: boolean = false,
): Promise<any> {
  query = format(query, {
    language: getSqlDialect(sqlType),
  });

  log(query, logs, params);
  switch (sqlType) {
    case "mysql":
    case "mariadb":
      const mysqlConnection = sqlDriver as MysqlConnectionInstance;
      return await mysqlConnection.query(query, params);

    case "postgres":
      const pgConnection = sqlDriver as PgClientInstance;
      return await pgConnection.query(query, params);

    case "sqlite":
      throw new Error("Cannot use execSql with sqlite");

    default:
      throw new Error("Unsupported database type");
  }
}
