import { Command } from "commander";
import migrationCreateConnector from "./hysteria_cli/migration_create_connector";
import runMigrationsConnector from "./hysteria_cli/migration_run_connector";
import rollbackMigrationsConnector from "./hysteria_cli/migration_rollback_connector";

const program = new Command();

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
  .option("-a, --alter", "Generate a template for an alter table migration", false)
  .option("-c, --create", "Generate a template for a create table migration", false)
  .action((name: string, option: { javascript: boolean, alter: boolean, create: boolean }) => {
    if (!name) {
      console.error("Error: migrations name is required.");
      process.exit(1);
    }

    if (option.alter && option.create) {
      console.error("Error: You can't use --alter and --create at the same time.");
      process.exit(1);
    }

    const migrationMode = option.alter ? 'alter' : option.create ? 'create' : 'basic';
    migrationCreateConnector(name, option.javascript, migrationMode);
  });

program
  .command("run:migrations [runUntil]")
  .option("-t, --tsconfig [path]", "Path to tsconfig.json file", undefined)
  .description(
    "Run pending migrations, if runUntil is provided, it will run all migrations until the provided migration name",
  )
  .action(async (runUntil: string, option?: { tsconfig?: string }) => {
    await runMigrationsConnector(runUntil, option?.tsconfig);
  });

program
  .command("rollback:migrations [rollbackUntil]")
  .option("-t, --tsconfig [path]", "Path to tsconfig.json file", undefined)
  .description(
    "Rollbacks every migration that has been run, if rollbackUntil is provided, it will rollback all migrations until the provided migration name",
  )
  .action(async (rollbackUntil: string, option?: { tsconfig?: string }) => {
    await rollbackMigrationsConnector(rollbackUntil, option?.tsconfig);
  });

program
  .command("refresh:migrations")
  .option("-t, --tsconfig [path]", "Path to tsconfig.json file", undefined)
  .description(
    "Rollbacks every migration that has been run and then run the migrations",
  )
  .action(async (option?: { tsconfig?: string }) => {
    await rollbackMigrationsConnector(undefined, option?.tsconfig);
    await runMigrationsConnector(undefined, option?.tsconfig);
  });

program.parse(process.argv);
