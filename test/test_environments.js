export const sqliteConfig = {
  type: "sqlite",
  database: "./sqlite.db",
  logs: true,
};

export const mysqlConfig = {
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
};

export const mariadbConfig = {
  type: "mariadb",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
};

export const pgConfig = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
};

export const cockroachdbConfig = {
  type: "cockroachdb",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 26257,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
};

export const mssqlConfig = {
  type: "mssql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433,
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "Password123!",
  database: process.env.DB_DATABASE || "master",
  logs: true,
};

export const oracledbConfig = {
  type: "oracledb",
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "hysteria",
  password: process.env.DB_PASSWORD || "oracle",
  database: process.env.DB_DATABASE || "FREEPDB1",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1521,
  logs: true,
};
