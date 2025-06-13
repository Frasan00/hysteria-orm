import { SqlDataSourceType } from "../../sql_data_source_types";

export const enQuoteColumnName = (name: string, dbType: SqlDataSourceType) => {
  switch (dbType) {
    case "sqlite":
      return `\`${name}\``;
    case "mysql":
    case "mariadb":
      return `\`${name}\``;
    case "postgres":
    case "cockroachdb":
      return `"${name}"`;
    default:
      return name;
  }
};
