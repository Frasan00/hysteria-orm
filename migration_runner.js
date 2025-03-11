const { execSync } = require("node:child_process");
const dotenv = require("dotenv");

dotenv.config();

const migrations = [
  "./test/sql/migrations",
];

const mysqlConfig = {
  type: "mysql",
  host: "localhost",
  user: "root",
  password: "root",
  database: "test",
};

const mariadbConfig = {
  type: "mariadb",
  host: "localhost",
  user: "root",
  port: 3307,
  password: "root",
  database: "test",
};

const pgConfig = {
  type: "postgres",
  host: "localhost",
  user: "root",
  password: "root",
  database: "test",
};

const sqliteConfig = {
  type: "sqlite",
  database: "./sqlite.db",
};


migrations.forEach((migration) => {
  // MySQL
  const mysqlEnv = `MIGRATION_PATH=${migration} DB_TYPE=${mysqlConfig.type} DB_HOST=${mysqlConfig.host} DB_USER=${mysqlConfig.user} DB_PASSWORD=${mysqlConfig.password} DB_DATABASE=${mysqlConfig.database}`;
  execSync(`${mysqlEnv} yarn test:fresh`, { stdio: 'inherit' });

  // MariaDB
  const mariadbEnv = `MIGRATION_PATH=${migration} DB_TYPE=${mariadbConfig.type} DB_HOST=${mariadbConfig.host} DB_PORT=${mariadbConfig.port} DB_USER=${mariadbConfig.user} DB_PASSWORD=${mariadbConfig.password} DB_DATABASE=${mariadbConfig.database}`;
  execSync(`${mariadbEnv} yarn test:fresh`, { stdio: 'inherit' });

  // PostgreSQL
  const pgEnv = `MIGRATION_PATH=${migration} DB_TYPE=${pgConfig.type} DB_HOST=${pgConfig.host} DB_USER=${pgConfig.user} DB_PASSWORD=${pgConfig.password} DB_DATABASE=${pgConfig.database}`;
  execSync(`${pgEnv} yarn test:fresh`, { stdio: 'inherit' });

  // SQLite
  const sqliteEnv = `MIGRATION_PATH=${migration.replace("migrations", "migrations_sqlite")} DB_TYPE=${sqliteConfig.type} DB_DATABASE=${sqliteConfig.database}`;
  execSync(`${sqliteEnv} yarn test:fresh`, { stdio: 'inherit' });

  console.log(`Finished migration: ${migration}`);
});

