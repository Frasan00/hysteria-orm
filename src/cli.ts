import { Command } from "commander";
import migrationCreateConnector from "./hysteria_cli/migration_create_connector";
import rollbackMigrationsConnector from "./hysteria_cli/migration_rollback_connector";
import runMigrationsConnector from "./hysteria_cli/migration_run_connector";
import runSqlConnector from "./hysteria_cli/run_sql_connector";
import fs from "node:fs";
import path from "node:path";

const program = new Command();

program
  .command("run:sql [sql]")
  .option("-f, --file [path]", "Path to the sql file", undefined)
  .description(
    "Run a sql file or a sql query directly from the command line for the given connection defined in the env file",
  )
  .action(async (sql?: string, option?: { file?: string }) => {
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
        await runSqlConnector(sql);
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    }

    if (!filePath) {
      throw new Error("No SQL statement or file provided");
    }

    filePath = path.resolve(filePath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const sqlStatement = fs.readFileSync(filePath, "utf-8");
    try {
      await runSqlConnector(sqlStatement);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program
  .command("create:migration <name>")
  .description(
    "Create a new migration file, standard folder is database/migrations from the current directory you are now, you can change it in the env MIGRATION_PATH",
  )
  .option(
    "-j, --javascript",
    "Generate a javascript file instead of a default typescript one",
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
    "Generate a template for a create table migration",
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
  .option("-t, --tsconfig [path]", "Path to tsconfig.json file", undefined)
  .description(
    "Run pending migrations, if runUntil is provided, it will run all migrations until the provided migration name",
  )
  .action(async (runUntil: string, option?: { tsconfig?: string }) => {
    try {
      await runMigrationsConnector(runUntil, option?.tsconfig);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program
  .command("rollback:migrations [rollbackUntil]")
  .option("-t, --tsconfig [path]", "Path to tsconfig.json file", undefined)
  .description(
    "Rollbacks every migration that has been run, if rollbackUntil is provided, it will rollback all migrations until the provided migration name",
  )
  .action(async (rollbackUntil: string, option?: { tsconfig?: string }) => {
    try {
      await rollbackMigrationsConnector(rollbackUntil, option?.tsconfig);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program
  .command("refresh:migrations")
  .option("-t, --tsconfig [path]", "Path to tsconfig.json file", undefined)
  .description(
    "Rollbacks every migration that has been run and then run the migrations",
  )
  .action(async (option?: { tsconfig?: string }) => {
    try {
      await rollbackMigrationsConnector(undefined, option?.tsconfig, false);
      await runMigrationsConnector(undefined, option?.tsconfig, false);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);
