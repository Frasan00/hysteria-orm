import { format } from "sql-formatter";
import { SqlDataSource } from "../sql/sql_data_source";
import { SqlDataSourceType } from "../sql/sql_data_source_types";

export const getSqlDialect = (
  sqlType: SqlDataSourceType,
): "mysql" | "postgresql" | "sqlite" | "mariadb" | "sql" => {
  switch (sqlType) {
    case "mysql":
      return "mysql";

    case "mariadb":
      return "mariadb";

    case "postgres":
    case "cockroachdb":
      return "postgresql";

    case "sqlite":
      return "sqlite";

    default:
      return "sql";
  }
};

const formatParam = (param: any): string => {
  if (param === null || param === undefined) {
    return "NULL";
  } else if (param instanceof Date) {
    return `'${param.toISOString()}'`;
  }

  const type = typeof param;
  if (type === "boolean") {
    return param ? "TRUE" : "FALSE";
  } else if (type === "number" && Number.isFinite(param)) {
    return String(param);
  } else if (type === "bigint") {
    return String(param);
  } else if (type === "string") {
    const escaped = param.replace(/'/g, "''");
    return `'${escaped}'`;
  }

  if (
    Array.isArray(param) ||
    (type === "object" && Object.keys(param).length > 0)
  ) {
    const json = JSON.stringify(param);
    const escaped = json.replace(/'/g, "''");
    return `'${escaped}'`;
  }

  return String(param);
};

/**
 * @description bind params into query, useful for logging and toQuery()
 */
export const bindParamsIntoQuery = (query: string, params: any[]): string => {
  let result = query;

  // Replace MySQL/SQLite-style placeholders (?) only up to params length
  for (let i = 0; i < params.length; i++) {
    if (!result.includes("?")) {
      break;
    }
    result = result.replace(/\?/, formatParam(params[i]));
  }

  // Replace PostgreSQL-style placeholders ($1, $2, ...)
  for (let i = 0; i < params.length; i++) {
    const pgPlaceholder = new RegExp(`\\$${i + 1}(?!\\d)`, "g");
    result = result.replace(pgPlaceholder, formatParam(params[i]));
  }

  return result;
};

export const isTableMissingError = (
  sqlType: SqlDataSourceType,
  error: any,
): boolean => {
  if (!error) {
    return false;
  }

  if (sqlType === "mysql" || sqlType === "mariadb") {
    return error.code === "ER_NO_SUCH_TABLE" || error.errno === 1146;
  }

  if (sqlType === "postgres" || sqlType === "cockroachdb") {
    return error.code === "42P01"; // undefined_table
  }

  if (sqlType === "sqlite") {
    return /no such table/i.test(String(error.message || ""));
  }

  return false;
};

export const formatQuery = (sql: SqlDataSource, query: string): string => {
  const dbType = sql.getDbType();
  let formattedQuery: string;
  try {
    formattedQuery = format(query, {
      ...sql.inputDetails.queryFormatOptions,
      language: getSqlDialect(dbType as SqlDataSourceType),
    });
  } catch (_) {
    // Retry without language
    try {
      formattedQuery = format(query, {
        ...sql.inputDetails.queryFormatOptions,
      });
    } catch (_) {
      // Ultimate fallback
      formattedQuery = query;
    }
  }

  return formattedQuery;
};
