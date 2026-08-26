const useWorktreeCompose = process.env.HYSTERIA_WORKTREE_COMPOSE === "1";

const hostFor = (database) =>
  process.env[`DB_HOST_${database.toUpperCase()}`] ||
  (useWorktreeCompose ? database : process.env.DB_HOST || "localhost");

const portFor = (database, localPort, composePort = localPort) =>
  Number(
    process.env[`DB_PORT_${database.toUpperCase()}`] ||
      (useWorktreeCompose ? composePort : process.env.DB_PORT || localPort),
  );

export const sqliteConfig = {
  type: "sqlite",
  database: "./sqlite.db",
  logs: true,
};

export const mysqlConfig = {
  type: "mysql",
  host: hostFor("mysql"),
  port: portFor("mysql", 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
};

export const mariadbConfig = {
  type: "mariadb",
  host: hostFor("mariadb"),
  port: portFor("mariadb", 3307, 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
};

export const pgConfig = {
  type: "postgres",
  host: hostFor("postgres"),
  port: portFor("postgres", 5432),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
};

export const cockroachdbConfig = {
  type: "cockroachdb",
  host: hostFor("cockroachdb"),
  port: portFor("cockroachdb", 26257),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
};

export const mssqlConfig = {
  type: "mssql",
  host: hostFor("mssql"),
  port: portFor("mssql", 1433),
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
