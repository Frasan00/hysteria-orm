import type { SqlDataSourceType, Timezone } from "../sql/sql_data_source_types";

export function parseTimeZone(sqlType: SqlDataSourceType, timezone: Timezone) {
  if (sqlType === "postgres") {
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
