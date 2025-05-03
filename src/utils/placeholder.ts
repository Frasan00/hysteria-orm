import { HysteriaError } from "../errors/hysteria_error";
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
      return query.replace(/\$PLACEHOLDER/g, () => "?");
    case "postgres":
    case "cockroachdb":
      let index = startIndex;
      return query.replace(/\$PLACEHOLDER/g, () => `$${index++}`);
    default:
      throw new HysteriaError(
        "convertPlaceHolderToValue",
        `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
      );
  }
};
