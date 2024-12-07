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
  .action((name: string, option: { javascript: boolean }) => {
    if (!name) {
      console.error("Error: migrations name is required.");
      process.exit(1);
    }

    migrationCreateConnector(name, option.javascript);
  });

program
  .command("run:migrations [runUntil]")
  .description(
    "Run pending migrations, if runUntil is provided, it will run all migrations until the provided migration name",
  )
  .action(async (runUntil: string) => {
    await runMigrationsConnector(runUntil);
  });

program
  .command("rollback:migrations [rollbackUntil]")
  .description(
    "Rollbacks every migration that has been run, if rollbackUntil is provided, it will rollback all migrations until the provided migration name",
  )
  .action(async (rollbackUntil: string) => {
    await rollbackMigrationsConnector(rollbackUntil);
  });

program
  .command("refresh:migrations")
  .description(
    "Rollbacks every migration that has been run and then run the migrations",
  )
  .action(async () => {
    await rollbackMigrationsConnector();
    await runMigrationsConnector();
  });

program.parse(process.argv);
