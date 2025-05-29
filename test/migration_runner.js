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
  execSync(`yarn test:fresh -t postgres -h ${pgConfig.host} -d ${pgConfig.database} -u ${pgConfig.user} -p ${pgConfig.password} --verbose --force -m ${migration}`, { stdio: "inherit" });

  // MySQL
  const mysqlEnv = `MIGRATION_PATH=${migration} DB_TYPE=${mysqlConfig.type} DB_HOST=${mysqlConfig.host} DB_USER=${mysqlConfig.user} DB_PASSWORD=${mysqlConfig.password} DB_DATABASE=${mysqlConfig.database}`;
  execSync(`${mysqlEnv} yarn test:fresh --verbose --force`, { stdio: "inherit" });

  // MariaDB
  const mariadbEnv = `MIGRATION_PATH=${migration} DB_TYPE=${mariadbConfig.type} DB_HOST=${mariadbConfig.host} DB_PORT=${mariadbConfig.port} DB_USER=${mariadbConfig.user} DB_PASSWORD=${mariadbConfig.password} DB_DATABASE=${mariadbConfig.database}`;
  execSync(`${mariadbEnv} yarn test:fresh --verbose`, { stdio: "inherit" });

  // CockroachDB
  const cockroachdbEnv = `MIGRATION_PATH=${migration} DB_TYPE=${cockroachdbConfig.type} DB_HOST=${cockroachdbConfig.host} DB_USER=${cockroachdbConfig.user} DB_PASSWORD=${cockroachdbConfig.password} DB_DATABASE=${cockroachdbConfig.database}`;
  execSync(`${cockroachdbEnv} yarn test:fresh --verbose --force`, { stdio: "inherit" });

  // SQLite
  const sqliteEnv = `MIGRATION_PATH=${migration.replace("migrations", "migrations_sqlite")} DB_TYPE=${sqliteConfig.type} DB_DATABASE=${sqliteConfig.database}`;
  execSync(`${sqliteEnv} yarn test:fresh --verbose --force`, { stdio: "inherit" });
});
