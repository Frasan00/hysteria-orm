import pino from "pino";
import { bindParamsIntoQuery } from "./query";

export type CustomLogger = {
  info(message: string): void;
  error(message: string): void;
  warn(message: string): void;
};

// SQL syntax highlighting colors
const sqlColors = {
  keyword: "\x1b[36m",
  string: "\x1b[32m",
  number: "\x1b[33m",
  operator: "\x1b[35m",
  reset: "\x1b[0m",
};

// SQL keywords to highlight
const sqlKeywords = [
  // Data Query Language (DQL)
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "HAVING",
  "ORDER BY",
  "LIMIT",
  "OFFSET",
  "FETCH",
  "FOR",
  "WITH",

  // Data Manipulation Language (DML)
  "INSERT",
  "UPDATE",
  "DELETE",
  "MERGE",
  "UPSERT",
  "REPLACE",
  "TRUNCATE",

  // Data Definition Language (DDL)
  "CREATE",
  "ALTER",
  "DROP",
  "RENAME",
  "TRUNCATE",
  "COMMENT",
  "GRANT",
  "REVOKE",

  // Table Operations
  "TABLE",
  "VIEW",
  "INDEX",
  "SEQUENCE",
  "SCHEMA",
  "DATABASE",
  "TABLESPACE",
  "PARTITION",

  // Joins
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "CROSS JOIN",
  "NATURAL JOIN",
  "LEFT OUTER JOIN",
  "RIGHT OUTER JOIN",
  "FULL OUTER JOIN",
  "USING",
  "ON",

  // Set Operations
  "UNION",
  "UNION ALL",
  "INTERSECT",
  "EXCEPT",
  "MINUS",

  // Constraints
  "PRIMARY KEY",
  "FOREIGN KEY",
  "UNIQUE",
  "CHECK",
  "DEFAULT",
  "NOT NULL",
  "NULL",

  // Data Types
  "INTEGER",
  "INT",
  "BIGINT",
  "SMALLINT",
  "TINYINT",
  "DECIMAL",
  "NUMERIC",
  "FLOAT",
  "REAL",
  "DOUBLE",
  "PRECISION",
  "MONEY",
  "CHAR",
  "VARCHAR",
  "TEXT",
  "NCHAR",
  "NVARCHAR",
  "NTEXT",
  "BINARY",
  "VARBINARY",
  "IMAGE",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "DATETIME",
  "INTERVAL",
  "BOOLEAN",
  "BOOL",
  "BIT",
  "BLOB",
  "CLOB",
  "JSON",
  "JSONB",
  "XML",
  "ARRAY",
  "ENUM",
  "SET",
  "GEOMETRY",
  "GEOGRAPHY",
  "POINT",
  "POLYGON",
  "LINESTRING",
  "MULTIPOINT",
  "MULTIPOLYGON",
  "MULTILINESTRING",
  "GEOMETRYCOLLECTION",

  // Functions and Aggregates
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "STDDEV",
  "VARIANCE",
  "COALESCE",
  "NULLIF",
  "IFNULL",
  "NVL",
  "DECODE",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "CAST",
  "CONVERT",
  "EXTRACT",
  "DATE_TRUNC",
  "DATE_PART",
  "NOW",
  "CURRENT_TIMESTAMP",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "INTERVAL",
  "OVER",
  "PARTITION BY",
  "ROWS",
  "RANGE",
  "UNBOUNDED",
  "PRECEDING",
  "FOLLOWING",
  "CURRENT ROW",
  "LAG",
  "LEAD",
  "FIRST_VALUE",
  "LAST_VALUE",
  "NTH_VALUE",
  "RANK",
  "DENSE_RANK",
  "ROW_NUMBER",
  "PERCENT_RANK",
  "CUME_DIST",
  "NTILE",

  // Operators
  "AND",
  "OR",
  "NOT",
  "IN",
  "EXISTS",
  "BETWEEN",
  "LIKE",
  "ILIKE",
  "SIMILAR TO",
  "REGEXP",
  "IS",
  "IS NOT",
  "ISNULL",
  "NOTNULL",
  "ALL",
  "ANY",
  "SOME",
  "DISTINCT",
  "UNIQUE",

  // Sorting
  "ASC",
  "DESC",
  "NULLS FIRST",
  "NULLS LAST",

  // Transactions
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "SAVEPOINT",
  "RELEASE",
  "TRANSACTION",
  "WORK",

  // Window Functions
  "OVER",
  "PARTITION BY",
  "ORDER BY",
  "ROWS",
  "RANGE",
  "GROUPS",
  "UNBOUNDED",
  "PRECEDING",
  "FOLLOWING",
  "CURRENT ROW",

  // PostgreSQL Specific
  "WITH RECURSIVE",
  "LATERAL",
  "RETURNING",
  "ON CONFLICT",
  "DO NOTHING",
  "DO UPDATE",
  "EXCLUDED",
  "DISTINCT ON",
  "FILTER",
  "WITHIN GROUP",
  "WITHIN",
  "WITHOUT",
  "WITH TIME ZONE",
  "WITHOUT TIME ZONE",
  "AT TIME ZONE",
  "COLLATE",
  "CASCADE",
  "RESTRICT",
  "DEFERRABLE",
  "INITIALLY",
  "DEFERRED",
  "IMMEDIATE",
  "MATCH",
  "FULL",
  "PARTIAL",
  "SIMPLE",
  "ON DELETE",
  "ON UPDATE",
  "SET NULL",
  "SET DEFAULT",
  "NO ACTION",
  "CASCADE",
  "RESTRICT",

  // MySQL Specific
  "AUTO_INCREMENT",
  "ENGINE",
  "CHARSET",
  "COLLATE",
  "STORAGE",
  "COMPRESSION",
  "ENCRYPTION",
  "ROW_FORMAT",
  "KEY_BLOCK_SIZE",
  "WITH PARSER",
  "WITH SYSTEM VERSIONING",
  "WITHOUT SYSTEM VERSIONING",
  "AS OF",
  "FOR SYSTEM_TIME",
  "FOR PORTION OF",
  "PERIOD FOR",
  "SYSTEM_TIME",
  "APPLICATION_TIME",
  "BUSINESS_TIME",
  "VALID FROM",
  "VALID TO",
  "WITH VALIDATION",
  "WITHOUT VALIDATION",

  // SQLite Specific
  "AUTOINCREMENT",
  "VIRTUAL",
  "STORED",
  "GENERATED",
  "ALWAYS",
  "BY DEFAULT",
  "AS",
  "WITHOUT ROWID",
  "STRICT",
  "TEMP",
  "TEMPORARY",
  "IF NOT EXISTS",
  "IF EXISTS",

  // Common Clauses
  "AS",
  "ON",
  "USING",
  "WHERE",
  "HAVING",
  "GROUP BY",
  "ORDER BY",
  "LIMIT",
  "OFFSET",
  "FOR UPDATE",
  "FOR SHARE",
  "FOR KEY SHARE",
  "FOR NO KEY UPDATE",
  "NOWAIT",
  "SKIP LOCKED",

  // Index Types
  "BTREE",
  "HASH",
  "GIST",
  "GIN",
  "BRIN",
  "SPGIST",
  "RUM",
  "BLOOM",
  "FULLTEXT",
  "SPATIAL",

  // Privileges
  "ALL",
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "TRUNCATE",
  "REFERENCES",
  "TRIGGER",
  "CREATE",
  "CONNECT",
  "TEMPORARY",
  "EXECUTE",
  "USAGE",
  "WITH GRANT OPTION",

  // Other
  "CASCADE",
  "RESTRICT",
  "SET NULL",
  "SET DEFAULT",
  "NO ACTION",
  "DEFERRABLE",
  "NOT DEFERRABLE",
  "INITIALLY DEFERRED",
  "INITIALLY IMMEDIATE",
  "MATCH FULL",
  "MATCH PARTIAL",
  "MATCH SIMPLE",
  "ON DELETE",
  "ON UPDATE",
  "REFERENCES",
  "CONSTRAINT",
  "CHECK",
  "DEFAULT",
  "UNIQUE",
  "PRIMARY KEY",
  "FOREIGN KEY",
  "INDEX",
  "VIEW",
  "TRIGGER",
  "PROCEDURE",
  "FUNCTION",
  "EVENT",
  "TABLESPACE",
  "SCHEMA",
  "DATABASE",
  "SERVER",
  "FOREIGN DATA WRAPPER",
  "FOREIGN TABLE",
  "MATERIALIZED VIEW",
  "SEQUENCE",
  "DOMAIN",
  "TYPE",
  "ENUM",
  "AGGREGATE",
  "OPERATOR",
  "OPERATOR CLASS",
  "OPERATOR FAMILY",
  "TEXT SEARCH CONFIGURATION",
  "TEXT SEARCH DICTIONARY",
  "TEXT SEARCH PARSER",
  "TEXT SEARCH TEMPLATE",
  "COLLATION",
  "CONVERSION",
  "LANGUAGE",
  "CAST",
  "CONVERT",
  "TRANSLATE",
  "TRANSLITERATE",
  "NORMALIZE",
  "TO",
  "FROM",
  "USING",
  "WITH",
  "WITHOUT",
  "WITHIN",
  "WITHOUT",
  "WITH TIME ZONE",
  "WITHOUT TIME ZONE",
  "AT TIME ZONE",
  "COLLATE",
  "CASCADE",
  "RESTRICT",
  "DEFERRABLE",
  "INITIALLY",
  "DEFERRED",
  "IMMEDIATE",
  "MATCH",
  "FULL",
  "PARTIAL",
  "SIMPLE",
  "ON DELETE",
  "ON UPDATE",
  "SET NULL",
  "SET DEFAULT",
  "NO ACTION",
  "CASCADE",
  "RESTRICT",
];

function highlightSqlQuery(query: string): string {
  let highlighted = query;

  // Highlight keywords
  sqlKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    highlighted = highlighted.replace(
      regex,
      `${sqlColors.keyword}$&${sqlColors.reset}`,
    );
  });

  // Highlight strings
  highlighted = highlighted.replace(
    /'[^']*'/g,
    `${sqlColors.string}$&${sqlColors.reset}`,
  );

  // Highlight numbers
  highlighted = highlighted.replace(
    /\b\d+\b/g,
    `${sqlColors.number}$&${sqlColors.reset}`,
  );

  // Highlight operators
  highlighted = highlighted.replace(
    /[=<>!]+/g,
    `${sqlColors.operator}$&${sqlColors.reset}`,
  );

  return highlighted;
}

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname,level",
      messageFormat: "{msg}",
      levelFirst: false,
      hideObject: true,
    },
  },
});

class HysteriaLogger {
  static loggerInstance: CustomLogger = {
    info(message: string): void {
      logger.info(message);
    },
    error(message: string): void {
      logger.error(message);
    },
    warn(message: string): void {
      logger.warn(message);
    },
  };

  static setCustomLogger(customLogger: CustomLogger) {
    this.loggerInstance = customLogger;
  }

  static info(message: string): void {
    this.loggerInstance.info(message);
  }

  static error(message: string | Error): void {
    if (message instanceof Error) {
      this.loggerInstance.error(String(message));
      return;
    }
    this.loggerInstance.error(message);
  }

  static warn(message: string): void {
    this.loggerInstance.warn(message);
  }
}

export function log(query: string, logs: boolean, params?: any[]) {
  const normalizedQuery = query.replace(/\s+/g, "").toUpperCase();
  if (
    !logs ||
    normalizedQuery === "SELECT1" ||
    normalizedQuery === "SELECT1;"
  ) {
    return;
  }

  if (params && params.length) {
    query = bindParamsIntoQuery(query, params);
  }

  const highlightedQuery = highlightSqlQuery(query);
  HysteriaLogger.loggerInstance.info(`\n${highlightedQuery}\n`);
}

export function logMessage(
  message: string,
  type: "info" | "error" | "warn",
  logs: boolean = false,
) {
  if (!logs) {
    return;
  }

  HysteriaLogger.loggerInstance[type](message);
}

export default HysteriaLogger;
