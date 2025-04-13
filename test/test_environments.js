export const sqliteConfig = {
  type: "sqlite",
  database: "./sqlite.db",
  logs: true,
};

export const mysqlConfig = {
  type: "mysql",
  host: "localhost",
  user: "root",
  password: "root",
  database: "test",
  logs: true,
};

export const mariadbConfig = {
  type: "mariadb",
  host: "localhost",
  user: "root",
  port: 3307,
  password: "root",
  database: "test",
  logs: true,
};

export const pgConfig = {
  type: "postgres",
  host: "localhost",
  user: "root",
  password: "root",
  database: "test",
  logs: true,
};

export const cockroachdbConfig = {
  type: "cockroachdb",
  host: "localhost",
  user: "root",
  port: 26257,
  password: "root",
  database: "test",
  logs: true,
};
