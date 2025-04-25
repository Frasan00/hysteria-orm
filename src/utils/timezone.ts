import type {
  DatabaseTimezone,
  SqlDataSourceType,
} from "../sql/sql_data_source_types";

export function parseTimeZone(
  sqlType: SqlDataSourceType,
  timezone: DatabaseTimezone,
) {
  if (sqlType === "postgres" || sqlType === "cockroachdb") {
    if (timezone === "LOCAL") {
      return "localtime";
    }

    return timezone;
  }

  if (sqlType === "mysql" || sqlType === "mariadb") {
    if (timezone === "UTC") {
      return "Z";
    }

    if (timezone === "LOCAL") {
      return "local";
    }

    return timezone;
  }

  if (sqlType === "sqlite") {
    return timezone;
  }

  return timezone;
}
