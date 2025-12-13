import { Command } from "commander";
import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const migrations = ["./test/sql/migrations"];

const ds = {
  postgres: path.resolve(process.cwd(), "test/sql_data_sources/postgres.ts"),
  mysql: path.resolve(process.cwd(), "test/sql_data_sources/mysql.ts"),
  mariadb: path.resolve(process.cwd(), "test/sql_data_sources/mariadb.ts"),
  cockroachdb: path.resolve(
    process.cwd(),
    "test/sql_data_sources/cockroachdb.ts"
  ),
  sqlite: path.resolve(process.cwd(), "test/sql_data_sources/sqlite.ts"),
  mssql: path.resolve(process.cwd(), "test/sql_data_sources/mssql.ts"),
  oracledb: path.resolve(process.cwd(), "test/sql_data_sources/oracledb.ts"),
};

const VALID_DB_TYPES = [
  "postgres",
  "mysql",
  "mariadb",
  "cockroachdb",
  "sqlite",
  "mssql",
  // "oracledb",
];

const getMigrationFolder = (dbType, baseMigration) => {
  if (dbType === "oracle" || dbType === "oracledb") {
    return baseMigration.replace("migrations", "migrations_oracle");
  }
  if (dbType === "mssql") {
    return baseMigration.replace("migrations", "migrations_mssql");
  }
  if (dbType === "sqlite") {
    return baseMigration.replace("migrations", "migrations_sqlite");
  }
  return baseMigration;
};

const getForceFlag = (dbType) => {
  return dbType !== "mariadb" ? "--force" : "";
};

const runMigration = async (dbType, migration) => {
  const migrationFolder = getMigrationFolder(dbType, migration);
  const forceFlag = getForceFlag(dbType);
  const dataSourcePath = ds[dbType === "oracledb" ? "oracledb" : dbType];

  console.log(`  → Running migrations for ${dbType.toUpperCase()}...`);

  const command =
    `node lib/cli.js refresh -d ${dataSourcePath} -m ${migrationFolder} ${forceFlag}`.trim();

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) {
      process.stdout.write(stdout);
    }

    if (stderr) {
      process.stderr.write(stderr);
    }
    console.log(`  ✓ ${dbType.toUpperCase()} migrations completed`);
  } catch (error) {
    console.log(`  ✗ ${dbType.toUpperCase()} migrations failed`);
    throw new Error(`[${dbType}] Migration failed: ${error.message}`);
  }
};

const runMigrations = async (databases) => {
  const dbsToRun = databases.length ? databases : VALID_DB_TYPES;

  const invalidDbs = dbsToRun.filter((db) => !VALID_DB_TYPES.includes(db));
  if (invalidDbs.length) {
    console.error(
      `Invalid database types: ${invalidDbs.join(", ")}. Valid types are: ${VALID_DB_TYPES.join(", ")}`
    );
    process.exit(1);
  }

  for (const migration of migrations) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🗄️  Migration: ${migration}`);
    console.log(`${"=".repeat(80)}\n`);

    console.log(
      `🔄 Running sequentially across ${dbsToRun.length} database(s)...\n`
    );
    for (const dbType of dbsToRun) {
      try {
        await runMigration(dbType, migration);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
    console.log(`\n✅ All databases completed for ${migration}`);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!`);
  console.log(`${"=".repeat(80)}\n`);
};

const program = new Command();

program
  .name("migration-runner")
  .description("Run database migrations for testing")
  .option(
    "-d, --database <databases...>",
    "Run migrations for specific database(s)",
    []
  )
  .action(async (options) => {
    try {
      await runMigrations(options.database);
    } catch (error) {
      console.error("Migration failed:", error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
