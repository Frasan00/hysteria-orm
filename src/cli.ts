import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import migrationCreateConnector from "./cli/migration_create_connector";
import rollbackMigrationsConnector from "./cli/migration_rollback_connector";
import runMigrationsConnector from "./cli/migration_run_connector";
import runSqlConnector from "./cli/run_sql_connector";
import dropAllTablesConnector from "./cli/drop_all_tables_connector";
import { SqlDataSourceType } from "./sql/sql_data_source_types";

type BaseSqlDataSourceCommandOptions = {
  type?: SqlDataSourceType;
  host?: string;
  database?: string;
  username?: string;
  password?: string;
};

const program = new Command();

program
  .command("run:sql [sql]")
  .option("-f, --file [path]", "Path to the sql file", undefined)
  .option("-h, --host [host]", "Host to connect to", undefined)
  .option("-d, --database [database]", "Database to connect to", undefined)
  .option("-u, --username [username]", "Username to connect to", undefined)
  .option("-p, --password [password]", "Password to connect to", undefined)
  .option("-t, --type [type]", "Type of the database to connect to", undefined)
  .description(
    "Run a sql file or a sql query directly from the command line for the given connection defined in the env file",
  )
  .action(
    async (
      sql?: string,
      option?: { file?: string } & BaseSqlDataSourceCommandOptions,
    ) => {
      const sqlDataSourceInput = {
        type: option?.type,
        host: option?.host,
        database: option?.database,
        username: option?.username,
        password: option?.password,
      };

      let filePath = option?.file;
      if (!sql && !filePath) {
        console.error("Error: SQL query or file path is required.");
        process.exit(1);
      }

      if (sql && filePath) {
        console.error("Error: You can't provide both sql query and file path.");
        process.exit(1);
      }

      if (sql) {
        try {
          await runSqlConnector(sql, {
            host: option?.host,
            database: option?.database,
            username: option?.username,
            password: option?.password,
          });
          process.exit(0);
        } catch (error) {
          console.error(error);
          process.exit(1);
        }
      }

      if (!filePath) {
        console.error("Error: No SQL statement or file provided");
        process.exit(1);
      }

      filePath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const sqlStatement = fs.readFileSync(filePath, "utf-8");
      try {
        await runSqlConnector(sqlStatement, sqlDataSourceInput);
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );

program
  .command("create:migration <name>")
  .description(
    "Create a new migration file, standard folder is migrations from the current directory you are now, you can change it in the env MIGRATION_PATH",
  )
  .option(
    "-j, --javascript",
    "Generate a javascript migration file instead of a default typescript one",
    false,
  )
  .option(
    "-a, --alter",
    "Generate a template for an alter table migration",
    false,
  )
  .option(
    "-c, --create",
    "Generate a template for a create table migration",
    false,
  )
  .option(
    "-t, --table <table>",
    "Specifies the target table name for the migration",
    false,
  )
  .action(
    (
      name: string,
      option: {
        javascript: boolean;
        alter: boolean;
        create: boolean;
        table: string;
      },
    ) => {
      if (!name) {
        console.error("Error: migrations name is required.");
        process.exit(1);
      }

      if (option.alter && option.create) {
        console.error(
          "Error: You can't use --alter and --create at the same time.",
        );
        process.exit(1);
      }

      if (option.table && !(option.create || option.alter)) {
        console.error(
          "Error: You can't use --table without --create or --alter.",
        );
        process.exit(1);
      }

      const migrationMode = option.alter
        ? "alter"
        : option.create
          ? "create"
          : "basic";

      migrationCreateConnector(
        name,
        option.javascript,
        migrationMode,
        option.table || name,
      );
      process.exit(0);
    },
  );

program
  .command("run:migrations [runUntil]")
  .option("-v, --verbose", "Verbose mode with all query logs", false)
  .option("-t, --type [type]", "Type of the database to connect to", undefined)
  .option("-h, --host [host]", "Host to connect to", undefined)
  .option("-d, --database [database]", "Database to connect to", undefined)
  .option("-u, --username [username]", "Username to connect to", undefined)
  .option("-p, --password [password]", "Password to connect to", undefined)
  .option(
    "-m, --migration-path [migrationPath]",
    "Path to the migrations",
    undefined,
  )
  .description(
    "Run pending migrations, if runUntil is provided, it will run all migrations until the provided migration name",
  )
  .action(
    async (
      runUntil: string,
      option?: {
        verbose: boolean;
        migrationPath: string;
      } & BaseSqlDataSourceCommandOptions,
    ) => {
      const sqlDataSourceInput = {
        type: option?.type,
        host: option?.host,
        database: option?.database,
        username: option?.username,
        password: option?.password,
        logs: option?.verbose,
      };

      try {
        await runMigrationsConnector(
          runUntil,
          sqlDataSourceInput,
          true,
          option?.migrationPath,
        );
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );

program
  .command("rollback:migrations [rollbackUntil]")
  .option("-v, --verbose", "Verbose mode with all query logs", false)
  .option("-t, --type [type]", "Type of the database to connect to", undefined)
  .option("-h, --host [host]", "Host to connect to", undefined)
  .option("-d, --database [database]", "Database to connect to", undefined)
  .option("-u, --username [username]", "Username to connect to", undefined)
  .option("-p, --password [password]", "Password to connect to", undefined)
  .option(
    "-m, --migration-path [migrationPath]",
    "Path to the migrations",
    undefined,
  )
  .description(
    "Rollbacks every migration that has been run, if rollbackUntil is provided, it will rollback all migrations until the provided migration name",
  )
  .action(
    async (
      rollbackUntil: string,
      option?: {
        verbose: boolean;
        migrationPath: string;
      } & BaseSqlDataSourceCommandOptions,
    ) => {
      const sqlDataSourceInput = {
        type: option?.type,
        host: option?.host,
        database: option?.database,
        username: option?.username,
        password: option?.password,
        logs: option?.verbose,
      };
      try {
        await rollbackMigrationsConnector(
          rollbackUntil,
          sqlDataSourceInput,
          true,
          option?.migrationPath,
        );
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );

program
  .command("refresh:migrations")
  .option("-v, --verbose", "Verbose mode with all query logs", false)
  .option(
    "-f, --force",
    "Drop all tables in the database before running the migrations instead of running the down migrations",
    false,
  )
  .option("-t, --type [type]", "Type of the database to connect to", undefined)
  .option("-h, --host [host]", "Host to connect to", undefined)
  .option("-d, --database [database]", "Database to connect to", undefined)
  .option("-u, --username [username]", "Username to connect to", undefined)
  .option("-p, --password [password]", "Password to connect to", undefined)
  .option("-m, --migration-path [path]", "Path to the migrations", undefined)
  .description(
    "Rollbacks every migration that has been run and then run the migrations",
  )
  .action(
    async (
      option?: {
        verbose: boolean;
        force: boolean;
        migrationPath: string;
      } & BaseSqlDataSourceCommandOptions,
    ) => {
      const force = option?.force || false;
      const sqlDataSourceInput = {
        type: option?.type,
        host: option?.host,
        database: option?.database,
        username: option?.username,
        password: option?.password,
        logs: option?.verbose,
      };

      try {
        force
          ? await dropAllTablesConnector(sqlDataSourceInput, false)
          : await rollbackMigrationsConnector(
              undefined,
              sqlDataSourceInput,
              false,
              option?.migrationPath,
            );

        await runMigrationsConnector(
          undefined,
          sqlDataSourceInput,
          true,
          option?.migrationPath,
        );
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );

program.parse(process.argv);
