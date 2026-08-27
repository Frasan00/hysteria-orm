import { format } from "sql-formatter";
import { highlight } from "sql-highlight";
import { getSqlDialect } from "./query";
import type { SqlDataSourceType } from "../sql/sql_data_source_types";

export type CustomLogger = {
  info(message: string): void;
  error(message: string): void;
  warn(message: string): void;
};

/**
 * @description Configuration for logging behavior
 * @warning Logs are synchronous by default and add overhead — do not use in production unless you override with an async custom logger. Logs are mainly for debugging.
 */
export type LoggerConfig = {
  /**
   * @description Minimum log level. Messages below this level are suppressed.
   * @default "info"
   */
  level?: "info" | "warn" | "error";

  /**
   * @description Whether to log SQL/Mongo queries.
   * @default true
   */
  logQueries?: boolean;

  /**
   * @description Custom logger instance. When provided, replaces the default console logger.
   */
  customLogger?: CustomLogger;
};

const LOG_LEVEL_PRIORITY: Record<string, number> = {
  info: 0,
  warn: 1,
  error: 2,
};

/**
 * @description Resolves a boolean | LoggerConfig into a normalized LoggerConfig
 */
export function resolveLoggerConfig(
  logs: boolean | LoggerConfig | undefined,
): LoggerConfig | null {
  if (!logs) {
    return null;
  }

  if (logs === true) {
    return { level: "info", logQueries: true };
  }

  return {
    level: logs.level ?? "info",
    logQueries: logs.logQueries ?? true,
    customLogger: logs.customLogger,
  };
}

/**
 * @description Checks if logging is enabled for a given level based on the config
 */
export function isLogEnabled(
  logs: boolean | LoggerConfig | undefined,
  level: "info" | "warn" | "error" = "info",
): boolean {
  const config = resolveLoggerConfig(logs);
  if (!config) {
    return false;
  }

  const minLevel = config.level ?? "info";
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

/**
 * @description Checks if query logging is enabled
 */
export function shouldLogQueries(
  logs: boolean | LoggerConfig | undefined,
): boolean {
  const config = resolveLoggerConfig(logs);
  if (!config) {
    return false;
  }

  return config.logQueries ?? true;
}

const ANSI = {
  info: "32",
  warn: "33",
  error: "31",
  query: "35",
  dim: "2",
  cyan: "36",
} as const;

const useColor =
  typeof process !== "undefined" &&
  Boolean(process.stdout?.isTTY) &&
  !process.env.NO_COLOR;

const paint = (code: string, text: string): string =>
  useColor ? `\x1b[${code}m${text}\x1b[0m` : text;

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const ms = now.getMilliseconds().toString().padStart(3, "0");

  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${ms}`;
}

function formatLogMessage(
  level: "info" | "warn" | "error",
  message: string,
): string {
  const ts = paint(ANSI.dim, `[${getTimestamp()}]`);
  const badge = paint(ANSI[level], level.toUpperCase().padEnd(5));
  return `${ts} ${badge} ${message}`;
}

const DEFAULT_MAX_STRING_LENGTH = 60;
const DEFAULT_MAX_PARAMS = 10;
const DEFAULT_MAX_PARAMS_LINE = 400;

function truncate(value: string, max = DEFAULT_MAX_STRING_LENGTH): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
}

function formatParam(param: any): string {
  if (param === null || param === undefined) {
    return "null";
  }

  if (typeof param === "string") {
    return `'${truncate(param)}'`;
  }

  if (typeof param === "number" || typeof param === "bigint") {
    return String(param);
  }

  if (typeof param === "boolean") {
    return param ? "true" : "false";
  }

  if (param instanceof Date) {
    return `'${truncate(param.toISOString())}'`;
  }

  if (typeof param === "object") {
    let json: string;
    try {
      json = JSON.stringify(param);
    } catch {
      json = String(param);
    }
    return `'${truncate(json)}'`;
  }

  return truncate(String(param));
}

export function formatParams(params: any[] | undefined): string {
  if (!params || params.length === 0) {
    return "[]";
  }

  const shown = params.slice(0, DEFAULT_MAX_PARAMS).map(formatParam);
  const hidden = params.length - shown.length;
  if (hidden > 0) {
    shown.push(`… (${hidden} more)`);
  }

  let line = `[${shown.join(", ")}]`;
  if (line.length > DEFAULT_MAX_PARAMS_LINE) {
    line = `${line.slice(0, DEFAULT_MAX_PARAMS_LINE)}…`;
  }

  return line;
}

const indent = (text: string, spaces: number): string => {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => `${pad}${line}`)
    .join("\n");
};

function colorizeDuration(ms: number): string {
  const code = ms < 10 ? ANSI.info : ms < 100 ? ANSI.warn : ANSI.error;
  return paint(code, `(${ms}ms)`);
}

function buildQueryMessage(
  highlightedQuery: string,
  params?: any[],
  durationMs?: number,
): string {
  const ts = paint(ANSI.dim, `[${getTimestamp()}]`);
  const badge = paint(ANSI.query, "QUERY");
  const head =
    durationMs === undefined
      ? `${ts} ${badge}`
      : `${ts} ${badge} ${colorizeDuration(durationMs)}`;

  const lines = [head, indent(highlightedQuery, 2)];

  if (params && params.length > 0) {
    lines.push(
      indent(`parameters: ${paint(ANSI.cyan, formatParams(params))}`, 4),
    );
  }

  return lines.join("\n");
}

const defaultCustomLogger: CustomLogger = {
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

class HysteriaLogger {
  static loggerInstance: CustomLogger = defaultCustomLogger;

  static setCustomLogger(customLogger: CustomLogger) {
    this.loggerInstance = customLogger;
  }

  static info(message: string): void {
    this.loggerInstance.info(message);
  }

  static error(message: string | Error): void {
    this.loggerInstance.error(
      message instanceof Error ? String(message) : message,
    );
  }

  static warn(message: string): void {
    this.loggerInstance.warn(message);
  }

  static query(message: string): void {
    if (this.loggerInstance === defaultCustomLogger) {
      console.log(message);
      return;
    }
    this.loggerInstance.info(message);
  }
}

export function log(
  query: string,
  logs: boolean | LoggerConfig,
  params?: any[],
  formatOptions?: Parameters<typeof format>[1],
  dialect?: SqlDataSourceType,
  durationMs?: number,
) {
  if (!shouldLogQueries(logs)) {
    return;
  }

  let formattedQuery = query;

  if (formatOptions || dialect) {
    try {
      formattedQuery = format(query, {
        ...formatOptions,
        language:
          formatOptions?.language ??
          (dialect ? getSqlDialect(dialect) : undefined),
      });
    } catch {
      formattedQuery = query;
    }
  }

  const highlightedQuery = highlight(formattedQuery, {
    colors: {
      keyword: "\x1b[34m",
      string: "\x1b[32m",
      number: "\x1b[33m",
      bracket: "\x1b[36m",
      clear: "\x1b[0m",
      comment: "\x1b[90m",
      function: "\x1b[35m",
      identifier: "\x1b[37m",
      special: "\x1b[31m",
    },
  });

  HysteriaLogger.query(buildQueryMessage(highlightedQuery, params, durationMs));
}

export function logMessage(
  message: string,
  type: "info" | "error" | "warn",
  logs: boolean | LoggerConfig = false,
) {
  if (!isLogEnabled(logs, type)) {
    return;
  }

  HysteriaLogger.loggerInstance[type](message);
}

export default HysteriaLogger;
