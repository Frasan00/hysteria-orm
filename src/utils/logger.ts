import { bindParamsIntoQuery } from "./query";

export type CustomLogger = {
  info(message: string): void;
  error(message: string): void;
  warn(message: string): void;
};

const colors = {
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
};

const sqlKeywords = [
  // DML
  "select",
  "insert",
  "update",
  "delete",
  "merge",
  "call",
  "explain",
  "lock",
  // DDL
  "create",
  "alter",
  "drop",
  "truncate",
  "rename",
  "comment",
  // DCL
  "grant",
  "revoke",
  // TCL
  "commit",
  "rollback",
  "savepoint",
  "set",
  "release",
  // Clauses
  "from",
  "where",
  "having",
  "group",
  "by",
  "order",
  "limit",
  "offset",
  "fetch",
  "into",
  "values",
  "set",
  "as",
  "on",
  "join",
  "inner",
  "left",
  "right",
  "full",
  "outer",
  "cross",
  "natural",
  "using",
  "union",
  "all",
  "distinct",
  "intersect",
  "except",
  "case",
  "when",
  "then",
  "else",
  "end",
  "exists",
  "in",
  "between",
  "like",
  "is",
  "null",
  "not",
  "and",
  "or",
  "asc",
  "desc",
  "with",
  "recursive",
  "over",
  "partition",
  "row_number",
  "rank",
  "dense_rank",
  "first_value",
  "last_value",
  "lead",
  "lag",
  // Functions
  "count",
  "sum",
  "avg",
  "min",
  "max",
  "coalesce",
  "nvl",
  "ifnull",
  "isnull",
  "greatest",
  "least",
  "substring",
  "substr",
  "length",
  "char_length",
  "character_length",
  "upper",
  "lower",
  "abs",
  "round",
  "floor",
  "ceil",
  "cast",
  "convert",
  "date",
  "time",
  "timestamp",
  "current_date",
  "current_time",
  "current_timestamp",
  "now",
  // Operators
  "=",
  "!=",
  "<>",
  "<",
  ">",
  "<=",
  ">=",
  "+",
  "-",
  "*",
  "/",
  "%",
  "||",
  // Other
  "primary",
  "key",
  "foreign",
  "references",
  "check",
  "unique",
  "default",
  "auto_increment",
  "identity",
  "cascade",
  "restrict",
  "add",
  "column",
  "table",
  "database",
  "schema",
  "index",
  "view",
  "procedure",
  "function",
  "trigger",
  "before",
  "after",
  "instead",
  "of",
  "for",
  "each",
  "row",
  "begin",
  "end",
  "declare",
  "if",
  "else",
  "elsif",
  "loop",
  "while",
  "repeat",
  "until",
  "do",
  "return",
  "returns",
  "language",
  "delimiter",
];

const blue = "\x1b[34m";
const white = "\x1b[37m";

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightSQL(sql: string): string {
  let highlighted = sql;
  for (const keyword of sqlKeywords) {
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "gi");
    highlighted = highlighted.replace(
      regex,
      (match) => `${blue}${match}${white}`,
    );
  }
  return `${white}${highlighted}${colors.reset}`;
}

function formatLogMessage(level: string, message: string): string {
  const timestamp = getTimestamp();
  const levelUpper = level.toUpperCase();

  if (level === "error") {
    return `${colors.error}[${levelUpper}] ${timestamp}\n${message}${colors.reset}\n`;
  }

  if (level === "warn") {
    return `${colors.warn}[${levelUpper}] ${timestamp}\n${message}${colors.reset}\n`;
  }

  if (level === "info") {
    return `${colors.info}[${levelUpper}] ${timestamp}\n${highlightSQL(message)}${colors.reset}\n`;
  }

  return `[${levelUpper}] ${timestamp}\n${message}\n`;
}

class HysteriaLogger {
  static loggerInstance: CustomLogger = {
    info(message: string): void {
      console.log(formatLogMessage("info", message));
    },
    error(message: string): void {
      console.error(formatLogMessage("error", message));
    },
    warn(message: string): void {
      console.warn(formatLogMessage("warn", message));
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
  if (!logs || query.replace(/\s/g, "").replace(/\n/g, "") === "SELECT1") {
    return;
  }

  if (params && params.length) {
    query = bindParamsIntoQuery(query, params);
  }

  HysteriaLogger.loggerInstance.info(query);
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
