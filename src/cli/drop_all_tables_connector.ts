import { env } from "../env/env";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../sql/resources/query/TRANSACTION";
import { SqlDataSource } from "../sql/sql_data_source";
import { SqlDataSourceType } from "../sql/sql_data_source_types";
import logger from "../utils/logger";
import MigrationTemplates from "./resources/migration_templates";
import fs from "fs/promises";

export default async function dropAllTablesConnector(
  verbose: boolean = false,
  shouldExit: boolean = true,
) {
  if (!env.DB_TYPE) {
    logger.error("DB_TYPE is not set could not drop all tables");
    process.exit(1);
  }

  if (!env.DB_DATABASE) {
    logger.error("DB_DATABASE is not set could not drop all tables");
    process.exit(1);
  }

  logger.info("Dropping all tables for database type: " + env.DB_TYPE);
  await SqlDataSource.connect({
    type: env.DB_TYPE as SqlDataSourceType,
    logs: verbose,
  });

  if (env.DB_TYPE === "sqlite") {
    await fs.rm(env.DB_DATABASE as string, { recursive: true, force: true });
    logger.info("Sqlite database dropped successfully");
    await fs.writeFile(env.DB_DATABASE as string, "");
    logger.info("Sqlite database recreated successfully");
    shouldExit && process.exit(0);
    return;
  }

  const templates = MigrationTemplates.getAllTablesTemplate(
    env.DB_TYPE as SqlDataSourceType,
    env.DB_DATABASE as string,
  );

  const tables: string[] = await SqlDataSource.rawQuery(templates);
  const parsedTables = MigrationTemplates.parseGetAllTables(
    env.DB_TYPE as SqlDataSourceType,
    env.DB_DATABASE as string,
    tables,
  );

  const dropAllTablesTemplate = MigrationTemplates.dropAllTablesTemplate(
    env.DB_TYPE as SqlDataSourceType,
    parsedTables,
  );

  await SqlDataSource.rawQuery(BEGIN_TRANSACTION);
  try {
    if (env.DB_TYPE === "mysql" || env.DB_TYPE === "mariadb") {
      await SqlDataSource.rawQuery(`SET FOREIGN_KEY_CHECKS = 0;`);
    }

    await SqlDataSource.rawQuery(dropAllTablesTemplate);

    if (env.DB_TYPE === "mysql" || env.DB_TYPE === "mariadb") {
      await SqlDataSource.rawQuery(`SET FOREIGN_KEY_CHECKS = 1;`);
    }

    await SqlDataSource.rawQuery(COMMIT_TRANSACTION);
  } catch (error: any) {
    await SqlDataSource.rawQuery(ROLLBACK_TRANSACTION);
    logger.error(error);
    process.exit(1);
  } finally {
    await SqlDataSource.closeConnection();
  }

  logger.info("All tables dropped successfully");
  shouldExit && process.exit(0);
}
