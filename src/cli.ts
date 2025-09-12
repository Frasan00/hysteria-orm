import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import dropAllTablesConnector from "./cli/drop_all_tables_connector";
import migrationCreateConnector from "./cli/migration_create_connector";
import rollbackMigrationsConnector from "./cli/migration_rollback_connector";
import runMigrationsConnector from "./cli/migration_run_connector";
import { GenerateMigrationTemplate } from "./cli/resources/generate_migration_template";
import { InitTemplates } from "./cli/resources/init_templates";
import runSqlConnector from "./cli/run_sql_connector";
import { SchemaDiff } from "./sql/migrations/schema_diff/schema_diff";
import { SqlDataSource } from "./sql/sql_data_source";
import { SqlDataSourceType } from "./sql/sql_data_source_types";
import { importTsUniversal } from "./utils/importer";
import logger from "./utils/logger";

const databaseTypes = ["sqlite", "mysql", "postgres", "mariadb", "cockroachdb"];
const allDatabaseTypes = databaseTypes.concat("mongodb", "redis");

const program = new Command();

program
  .command("init")
  .option(
    "-t, --type [type]",
    `Type of the database to connect to, available types: ${allDatabaseTypes.join(", ")}`,
    undefined,
  )
  .description(
    "Initialize the hysteria-orm with standard configuration, it will create a database if not exists and a migrations folder inside it if not exists, it will also create a index.ts file in the database folder",
  )
  .action(async (option: { type: SqlDataSourceType }) => {
    if (!option.type) {
      logger.error("Database type is required");
      process.exit(1);
    }

    if (!allDatabaseTypes.includes(option.type)) {
      logger.error(
        `Invalid database type: ${option.type}, available types: ${allDatabaseTypes.join(", ")}`,
      );
      process.exit(1);
    }

    logger.info("Initializing hysteria-orm with standard configuration");
    logger.info(
      `Database type: ${option.type || "not specified (will use env DB_TYPE)"}`,
    );

    const template = InitTemplates.initTemplate(option.type);
    if (!fs.existsSync("database")) {
      fs.mkdirSync("database", { recursive: true });
    } else {
      logger.info("database folder already exists, skipping");
    }

    if (!fs.existsSync("database/index.ts")) {
      fs.writeFileSync("database/index.ts", template);
    } else {
      logger.info("database/index.ts file already exists, skipping");
    }

    if (
      databaseTypes.includes(option.type) &&
      !fs.existsSync("database/migrations")
    ) {
      fs.mkdirSync("database/migrations", { recursive: true });
    } else {
      logger.info(
        "database/migrations folder already exists or is not a sql database, skipping",
      );
    }

    logger.info("Initialization completed successfully");
  });

program
  .command("run:sql [sql]")
  .option("-f, --file [path]", "Path to the sql file", undefined)
  .option(
    "-d, --datasource [path]",
    "Path to SqlDataSource (default export)",
    undefined,
  )
  .option("-o, --out [query]", "File path to save the query result", undefined)
  .option(
    "-t, --tsconfig [tsconfigPath]",
    "Path to the tsconfig.json file, defaults to ./tsconfig.json",
    undefined,
  )
  .description(
    "Run a sql file or a sql query directly from the command line for the given connection defined in the env file",
  )
  .action(
    async (
      sql?: string,
      option?: {
        file?: string;
        datasource?: string;
        out?: string;
        tsconfigPath?: string;
      },
    ) => {
      logger.info("Starting SQL execution");
      if (!option?.datasource) {
        logger.error("SqlDataSource file path is required (-d|--datasource)");
        process.exit(1);
      }

      let filePath = option?.file;
      if (!sql && !filePath) {
        logger.error("SQL query or file path is required");
        process.exit(1);
      }

      if (sql && filePath) {
        logger.error("Cannot provide both sql query and file path");
        process.exit(1);
      }

      const resolvedPath = path.resolve(process.cwd(), option.datasource);
      const { default: sqlDs } = await importTsUniversal<{
        default: SqlDataSource;
      }>(resolvedPath, option?.tsconfigPath);

      if (sql) {
        logger.info("Executing SQL query directly from command line");
        try {
          await runSqlConnector(sql, sqlDs, option?.out);
          logger.info("SQL execution completed successfully");
          process.exit(0);
        } catch (error) {
          logger.error(`SQL execution failed: ${error}`);
          process.exit(1);
        }
      }

      if (!filePath) {
        logger.error("No SQL statement or file provided");
        process.exit(1);
      }

      logger.info(`Reading SQL from file: ${filePath}`);
      filePath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(filePath)) {
        logger.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const sqlStatement = fs.readFileSync(filePath, "utf-8");
      logger.info(
        `SQL file loaded successfully (${sqlStatement.length} characters)`,
      );
      try {
        await runSqlConnector(sqlStatement, sqlDs, option?.out);
        logger.info("SQL file execution completed successfully");
        process.exit(0);
      } catch (error) {
        logger.error(`SQL file execution failed: ${error}`);
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
      logger.info(`Creating migration: ${name}`);
      logger.info(
        `Migration options: javascript=${option.javascript}, alter=${option.alter}, create=${option.create}, table=${option.table || "not specified"}`,
      );

      if (!name) {
        logger.error("Migration name is required");
        process.exit(1);
      }

      if (option.alter && option.create) {
        logger.error("Cannot use --alter and --create at the same time");
        process.exit(1);
      }

      if (option.table && !(option.create || option.alter)) {
        logger.error("Cannot use --table without --create or --alter");
        process.exit(1);
      }

      const migrationMode = option.alter
        ? "alter"
        : option.create
          ? "create"
          : "basic";

      logger.info(`Migration mode: ${migrationMode}`);
      migrationCreateConnector(
        name,
        option.javascript,
        migrationMode,
        option.table || name,
      );
    },
  );

program
  .command("run:migrations [runUntil]")
  .option(
    "-c, --tsconfig [tsconfigPath]",
    "Path to the tsconfig.json file, defaults to ./tsconfig.json",
    undefined,
  )
  .option(
    "-d, --datasource [path]",
    "Path to SqlDataSource (default export)",
    undefined,
  )
  .option(
    "-m, --migration-path [migrationPath]",
    "Path to the migrations",
    undefined,
  )
  .option(
    "-t, --transactional",
    "Runs all the pending migrations in a single transaction, this does not apply to mysql since it does not support transactions inside schema changes",
    true,
  )
  .description(
    "Run pending migrations, if runUntil is provided, it will run all migrations until the provided migration name",
  )
  .action(
    async (
      runUntil: string,
      option?: {
        migrationPath: string;
        tsconfigPath: string;
        datasource?: string;
        transactional: boolean;
      },
    ) => {
      if (!option?.datasource) {
        logger.error("SqlDataSource file path is required (-d|--datasource)");
        process.exit(1);
      }
      const { default: sqlDs } = await importTsUniversal<{
        default: SqlDataSource;
      }>(path.resolve(process.cwd(), option.datasource), option?.tsconfigPath);

      try {
        await runMigrationsConnector(
          sqlDs,
          runUntil,
          true,
          option?.migrationPath,
          option?.tsconfigPath,
          option?.transactional,
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
  .option(
    "-c, --tsconfig [tsconfigPath]",
    "Path to the tsconfig.json file, defaults to ./tsconfig.json",
    undefined,
  )
  .option(
    "-d, --datasource [path]",
    "Path to SqlDataSource (default export)",
    undefined,
  )
  .option(
    "-m, --migration-path [migrationPath]",
    "Path to the migrations",
    undefined,
  )
  .option(
    "-t, --transactional",
    "Runs all the pending migrations in a single transaction, this does not apply to mysql since it does not support transactions inside schema changes",
    true,
  )
  .description(
    "Rollbacks every migration that has been run, if rollbackUntil is provided, it will rollback all migrations until the provided migration name",
  )
  .action(
    async (
      rollbackUntil: string,
      option?: {
        migrationPath: string;
        tsconfigPath: string;
        datasource?: string;
        transactional: boolean;
      },
    ) => {
      if (!option?.datasource) {
        logger.error("SqlDataSource file path is required (-d|--datasource)");
        process.exit(1);
      }
      const { default: sqlDs } = await importTsUniversal<{
        default: SqlDataSource;
      }>(path.resolve(process.cwd(), option.datasource), option?.tsconfigPath);

      try {
        await rollbackMigrationsConnector(
          sqlDs,
          rollbackUntil,
          true,
          option?.migrationPath,
          option?.tsconfigPath,
          option?.transactional,
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
  .option(
    "-f, --force",
    "Drop all tables in the database before running the migrations instead of running the down migrations",
    false,
  )
  .option(
    "-c, --tsconfig [tsconfigPath]",
    "Path to the tsconfig.json file, defaults to ./tsconfig.json",
    undefined,
  )
  .option(
    "-d, --datasource [path]",
    "Path to SqlDataSource (default export)",
    undefined,
  )
  .option(
    "-t, --transactional",
    "Runs all the pending migrations in a single transaction, this does not apply to mysql since it does not support transactions inside schema changes",
    true,
  )
  .option("-m, --migration-path [path]", "Path to the migrations", undefined)
  .description(
    "Rollbacks every migration that has been run and then run the migrations",
  )
  .action(
    async (option?: {
      force: boolean;
      migrationPath: string;
      tsconfigPath: string;
      datasource?: string;
      transactional: boolean;
    }) => {
      const force = option?.force || false;
      if (!option?.datasource) {
        logger.error("SqlDataSource file path is required (-d|--datasource)");
        process.exit(1);
      }
      const { default: sqlDs } = await importTsUniversal<{
        default: SqlDataSource;
      }>(path.resolve(process.cwd(), option.datasource), option?.tsconfigPath);

      try {
        force
          ? await dropAllTablesConnector(sqlDs, false, option?.transactional)
          : await rollbackMigrationsConnector(
              sqlDs,
              undefined,
              false,
              option?.migrationPath,
              option?.tsconfigPath,
              option?.transactional,
            );

        await runMigrationsConnector(
          sqlDs,
          undefined,
          true,
          option?.migrationPath,
          option?.tsconfigPath,
          option?.transactional,
        );
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );

program
  .command("generate:migrations")
  .description(
    "Generate a migration file based on the database schema and the models metadata, not supported for sqlite",
  )
  .option(
    "-c, --tsconfig [tsconfigPath]",
    "Path to the tsconfig.json file, defaults to ./tsconfig.json",
    undefined,
  )
  .option(
    "-d, --datasource [path]",
    "Path to SqlDataSource (default export)",
    undefined,
  )
  .option(
    "-f, --dry [path]",
    "Does not create a migration file but only outputs sql statements",
    undefined,
  )
  .option(
    "-j, --javascript",
    "Generate a javascript migration file instead of a default typescript one",
    false,
  )
  .option("-m, --migration-path [path]", "Path to the migrations", undefined)
  .option("-n, --name [name]", "Name of the migration", undefined)
  .action(
    async (option?: {
      tsconfigPath: string;
      datasource?: string;
      migrationPath: string;
      javascript: boolean;
      name: string;
      dry?: boolean;
    }) => {
      if (!option?.datasource) {
        logger.error("SqlDataSource file path is required (-d|--datasource)");
        process.exit(1);
      }

      if (!option?.migrationPath) {
        option.migrationPath = path.resolve(
          process.cwd(),
          "database/migrations",
        );
      }

      if (!option?.name) {
        option.name = `auto_generated_migration`;
      }

      option.name = `${Date.now()}_${option.name}`;

      const { default: sqlDs } = await importTsUniversal<{
        default: SqlDataSource;
      }>(path.resolve(process.cwd(), option.datasource), option?.tsconfigPath);

      if (sqlDs.getDbType() === "sqlite") {
        logger.error(
          "generate:migrations with sqlite is not supported, it's suggested to use manual migrations instead",
        );
        process.exit(1);
      }

      try {
        const diff = await SchemaDiff.makeDiff(sqlDs);
        const sqlStatements = diff.getSqlStatements();
        if (!sqlStatements.length) {
          logger.info(
            `No new changes detected between database schema and models metadata`,
          );
          process.exit(0);
        }

        if (option.dry) {
          for (const sql of sqlStatements) {
            console.log(sql);
          }

          process.exit(0);
        }

        if (!fs.existsSync(option?.migrationPath)) {
          fs.mkdirSync(option?.migrationPath, { recursive: true });
        }

        const template =
          await GenerateMigrationTemplate.generate(sqlStatements);

        const extension = option?.javascript ? ".js" : ".ts";
        fs.writeFileSync(
          `${option?.migrationPath}/${option?.name}${extension}`,
          template,
        );
        logger.info(
          `Migration file created successfully: ${option?.name}${extension}`,
        );
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );

program.parse(process.argv);
