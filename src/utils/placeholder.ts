import type { SqlDataSourceType } from "../sql/sql_data_source_types";

export const convertPlaceHolderToValue = (
  dbType: SqlDataSourceType,
  query: string,
  startIndex: number = 1,
) => {
  switch (dbType) {
    case "mysql":
    case "sqlite":
    case "mariadb":
      return query.replace(/PLACEHOLDER/g, () => "?");
    case "postgres":
      let index = startIndex;
      return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
    default:
      throw new Error("Unsupported database type");
  }
};
