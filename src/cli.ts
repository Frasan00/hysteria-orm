import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { logger } from ".";
import dropAllTablesConnector from "./cli/drop_all_tables_connector";
import migrationCreateConnector from "./cli/migration_create_connector";
import rollbackMigrationsConnector from "./cli/migration_rollback_connector";
import runMigrationsConnector from "./cli/migration_run_connector";
import runSqlConnector from "./cli/run_sql_connector";
import { SqlDataSourceType } from "./sql/sql_data_source_types";
import { InitTemplates } from "./cli/resources/init_templates";

const databaseTypes = ["sqlite", "mysql", "postgres", "mariadb", "cockroachdb"];
const allDatabaseTypes = databaseTypes.concat("mongodb", "redis");

type BaseSqlDataSourceCommandOptions = {
  type?: SqlDataSourceType;
  host?: string;
  database?: string;
  username?: string;
  password?: string;
};

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
  .option("-h, --host [host]", "Host to connect to", undefined)
  .option("-d, --database [database]", "Database to connect to", undefined)
  .option("-u, --username [username]", "Username to connect to", undefined)
  .option("-p, --password [password]", "Password to connect to", undefined)
  .option(
    "-t, --type [type]",
    `Type of the database to connect to, available types: ${databaseTypes.join(", ")}`,
    undefined,
  )
  .description(
    "Run a sql file or a sql query directly from the command line for the given connection defined in the env file",
  )
  .action(
    async (
      sql?: string,
      option?: { file?: string } & BaseSqlDataSourceCommandOptions,
    ) => {
      logger.info("Starting SQL execution");

      const sqlDataSourceInput = {
        type: option?.type,
        host: option?.host,
        database: option?.database,
        username: option?.username,
        password: option?.password,
      };

      let filePath = option?.file;
      if (!sql && !filePath) {
        logger.error("SQL query or file path is required");
        process.exit(1);
      }

      if (sql && filePath) {
        logger.error("Cannot provide both sql query and file path");
        process.exit(1);
      }

      if (sql) {
        logger.info("Executing SQL query directly from command line");
        try {
          await runSqlConnector(sql, {
            host: option?.host,
            database: option?.database,
            username: option?.username,
            password: option?.password,
          });
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
        await runSqlConnector(sqlStatement, sqlDataSourceInput);
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
  .option("-v, --verbose", "Verbose mode with all query logs", false)
  .option(
    "-t, --type [type]",
    `Type of the database to connect to, available types: ${databaseTypes.join(", ")}`,
    undefined,
  )
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
  .option(
    "-t, --type [type]",
    `Type of the database to connect to, available types: ${databaseTypes.join(", ")}`,
    undefined,
  )
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
  .option(
    "-t, --type [type]",
    `Type of the database to connect to, available types: ${databaseTypes.join(", ")}`,
    undefined,
  )
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
