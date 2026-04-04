import type { DbConfig, Dialect } from "./adapters/types.js";

const defaultConfigs: Record<Dialect, DbConfig> = {
  pg: {
    host: process.env.BENCH_PG_HOST ?? "localhost",
    port: parseInt(process.env.BENCH_PG_PORT ?? "5432"),
    user: process.env.BENCH_PG_USER ?? "root",
    password: process.env.BENCH_PG_PASSWORD ?? "root",
    database: process.env.BENCH_PG_DATABASE ?? "test",
    dialect: "pg",
  },
  mysql: {
    host: process.env.BENCH_MYSQL_HOST ?? "localhost",
    port: parseInt(process.env.BENCH_MYSQL_PORT ?? "3306"),
    user: process.env.BENCH_MYSQL_USER ?? "root",
    password: process.env.BENCH_MYSQL_PASSWORD ?? "root",
    database: process.env.BENCH_MYSQL_DATABASE ?? "test",
    dialect: "mysql",
  },
};

export function getConfig(dialect: Dialect): DbConfig {
  return defaultConfigs[dialect];
}

export const WARMUP_ITERS = parseInt(process.env.BENCH_WARMUP ?? "1000");
export const BENCH_ITERS = parseInt(process.env.BENCH_ITERS ?? "1000");
