import { execSync } from "node:child_process";
import {
  mysqlConfig,
  mariadbConfig,
  pgConfig,
  cockroachdbConfig,
  sqliteConfig,
} from "./test_environments.js";

const migrations = ["./test/sql/migrations"];

migrations.forEach((migration) => {
  // PostgreSQL
  const pgEnv = `MIGRATION_PATH=${migration} DB_TYPE=${pgConfig.type} DB_HOST=${pgConfig.host} DB_USER=${pgConfig.user} DB_PASSWORD=${pgConfig.password} DB_DATABASE=${pgConfig.database}`;
  execSync(`${pgEnv} yarn test:fresh --verbose --drop`, { stdio: "inherit" });

  // MySQL
  const mysqlEnv = `MIGRATION_PATH=${migration} DB_TYPE=${mysqlConfig.type} DB_HOST=${mysqlConfig.host} DB_USER=${mysqlConfig.user} DB_PASSWORD=${mysqlConfig.password} DB_DATABASE=${mysqlConfig.database}`;
  execSync(`${mysqlEnv} yarn test:fresh --verbose --drop`, { stdio: "inherit" });

  // MariaDB
  const mariadbEnv = `MIGRATION_PATH=${migration} DB_TYPE=${mariadbConfig.type} DB_HOST=${mariadbConfig.host} DB_PORT=${mariadbConfig.port} DB_USER=${mariadbConfig.user} DB_PASSWORD=${mariadbConfig.password} DB_DATABASE=${mariadbConfig.database}`;
  execSync(`${mariadbEnv} yarn test:fresh --verbose --drop`, { stdio: "inherit" });

  // CockroachDB
  const cockroachdbEnv = `MIGRATION_PATH=${migration} DB_TYPE=${cockroachdbConfig.type} DB_HOST=${cockroachdbConfig.host} DB_USER=${cockroachdbConfig.user} DB_PASSWORD=${cockroachdbConfig.password} DB_DATABASE=${cockroachdbConfig.database}`;
  execSync(`${cockroachdbEnv} yarn test:fresh --verbose --drop`, { stdio: "inherit" });

  // SQLite
  const sqliteEnv = `MIGRATION_PATH=${migration.replace("migrations", "migrations_sqlite")} DB_TYPE=${sqliteConfig.type} DB_DATABASE=${sqliteConfig.database}`;
  execSync(`${sqliteEnv} yarn test:fresh --verbose --drop`, { stdio: "inherit" });
});
