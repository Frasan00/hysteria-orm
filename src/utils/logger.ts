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

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function formatLogMessage(level: string, message: string): string {
  const timestamp = getTimestamp();
  const color = colors[level as keyof typeof colors] || colors.reset;
  return `${timestamp} ${color}${level}${colors.reset}: \n${color}${message}${colors.reset}`;
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
  if (!logs) {
    return;
  }

  if (params && params.length) {
    params.forEach((param, index) => {
      let formattedParam: any = null;

      if (typeof param === "string") {
        formattedParam = `'${param}'`;
      } else if (
        typeof param === "object" &&
        param !== null &&
        Object.keys(param).length > 0
      ) {
        formattedParam = `'${JSON.stringify(param)}'`;
      } else {
        formattedParam = param;
      }

      // Replace MySQL-style placeholders
      query = query.replace(/\?/, formattedParam);

      // Replace PostgreSQL-style placeholders
      const pgPlaceholder = new RegExp(`\\$${index + 1}`, "g");
      query = query.replace(pgPlaceholder, formattedParam);
    });
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
