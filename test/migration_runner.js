import { execSync } from "node:child_process";
import path from "node:path";

const migrations = ["./test/sql/migrations"];

const ds = {
  postgres: path.resolve(process.cwd(), "test/sql_data_sources/postgres.ts"),
  mysql: path.resolve(process.cwd(), "test/sql_data_sources/mysql.ts"),
  mariadb: path.resolve(process.cwd(), "test/sql_data_sources/mariadb.ts"),
  cockroachdb: path.resolve(
    process.cwd(),
    "test/sql_data_sources/cockroachdb.ts",
  ),
  sqlite: path.resolve(process.cwd(), "test/sql_data_sources/sqlite.ts"),
};

migrations.forEach((migration) => {
  // PostgreSQL
  execSync(
    `node lib/cli.js refresh:migrations -d ${ds.postgres} -m ${migration} --force`,
    { stdio: "inherit" },
  );

  // MySQL
  execSync(
    `node lib/cli.js refresh:migrations -d ${ds.mysql} -m ${migration} --force`,
    { stdio: "inherit" },
  );

  // MariaDB
  execSync(
    `node lib/cli.js refresh:migrations -d ${ds.mariadb} -m ${migration}`,
    { stdio: "inherit" },
  );

  // CockroachDB
  execSync(
    `node lib/cli.js refresh:migrations -d ${ds.cockroachdb} -m ${migration} --force`,
    { stdio: "inherit" },
  );

  // SQLite (uses dedicated migrations folder)
  execSync(
    `node lib/cli.js refresh:migrations -d ${ds.sqlite} -m ${migration.replace(
      "migrations",
      "migrations_sqlite",
    )} --force`,
    { stdio: "inherit" },
  );
});
