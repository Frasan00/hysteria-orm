import { highlight } from "sql-highlight";

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

const colors = {
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
};

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
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
    return `${colors.info}[${levelUpper}] ${timestamp}\n${message}${colors.reset}\n`;
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

function formatParams(params: any[]): string {
  return params
    .map((param) => {
      if (typeof param === "object") {
        return JSON.stringify(param);
      }

      if (typeof param === "string") {
        return `'${param}'`;
      }

      if (typeof param === "number") {
        return param;
      }

      if (typeof param === "boolean") {
        return param ? "true" : "false";
      }

      return param;
    })
    .join(", ");
}

export function log(
  query: string,
  logs: boolean | LoggerConfig,
  params?: any[],
) {
  if (!shouldLogQueries(logs)) {
    return;
  }

  query = highlight(query, {
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

  const logMessage = `${query} [${formatParams(params || [])}]`;
  HysteriaLogger.loggerInstance.info(logMessage);
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
