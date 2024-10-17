import winston from "winston";

interface LogColors {
  info: string;
  warn: string;
  error: string;
  [key: string]: string;
}

const colors: LogColors = {
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp }) => {
    const color = colors[level] || "\x1b[0m";
    return `${timestamp} ${color}${level}\x1b[0m: ${color}${message}\x1b[0m`;
  }),
);

const consoleTransport = new winston.transports.Console();
const fileTransport = new winston.transports.File({ filename: "logfile.log" });

const logger = winston.createLogger({
  format: logFormat,
  transports: [consoleTransport, fileTransport],
});

export function log(query: string, logs: boolean, params?: any[]) {
  if (!logs) {
    return;
  }

  if (params && params.length) {
    params.forEach((param, index) => {
      let formattedParam: any = null;

      if (typeof param === "string") {
        // Format string parameters
        formattedParam = `'${param}'`;
      } else if (
        typeof param === "object" &&
        param !== null &&
        Object.keys(param).length > 0
      ) {
        // Format object parameters
        formattedParam = `'${JSON.stringify(param)}'`;
      } else {
        // Use the parameter as is for other types (e.g., numbers)
        formattedParam = param;
      }

      // Replace MySQL-style placeholders
      query = query.replace(/\?/, formattedParam);

      // Replace PostgreSQL-style placeholders
      const pgPlaceholder = new RegExp(`\\$${index + 1}`, "g");
      query = query.replace(pgPlaceholder, formattedParam);
    });
  }

  logger.info("\n" + query);
}

export function queryError(error: any) {
  logger.error("query Failed ", error);
}

export default logger;
