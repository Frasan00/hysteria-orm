import { env } from "../env/env";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../sql/resources/query/TRANSACTION";
import { SqlDataSource } from "../sql/sql_data_source";
import {
  SqlDataSourceInput,
  SqlDataSourceType,
} from "../sql/sql_data_source_types";
import logger from "../utils/logger";
import MigrationTemplates from "./resources/migration_templates";
import fs from "fs/promises";

export default async function dropAllTablesConnector(
  sqlDataSourceInput?: Partial<SqlDataSourceInput>,
  shouldExit: boolean = true,
) {
  const dbType = sqlDataSourceInput?.type || env.DB_TYPE;
  const dbDatabase = sqlDataSourceInput?.database || env.DB_DATABASE;
  if (!dbType) {
    logger.error("DB_TYPE is not set could not drop all tables");
    process.exit(1);
  }

  if (!dbDatabase) {
    logger.error("DB_DATABASE is not set could not drop all tables");
    process.exit(1);
  }

  logger.info("Dropping all tables for database type: " + dbType);
  await SqlDataSource.connect({
    type: dbType as SqlDataSourceType,
    database: dbDatabase,
    ...sqlDataSourceInput,
  } as SqlDataSourceInput);

  if (dbType === "sqlite") {
    await fs.rm(dbDatabase as string, { recursive: true, force: true });
    logger.info("Sqlite database dropped successfully");
    await fs.writeFile(dbDatabase as string, "");
    logger.info("Sqlite database recreated successfully");
    shouldExit && process.exit(0);
    return;
  }

  const templates = MigrationTemplates.getAllTablesTemplate(
    dbType as SqlDataSourceType,
    dbDatabase as string,
  );

  const tables: string[] = await SqlDataSource.rawQuery(templates);
  const parsedTables = MigrationTemplates.parseGetAllTables(
    dbType as SqlDataSourceType,
    dbDatabase as string,
    tables,
  );

  const dropAllTablesTemplate = MigrationTemplates.dropAllTablesTemplate(
    dbType as SqlDataSourceType,
    parsedTables,
  );

  await SqlDataSource.rawQuery(BEGIN_TRANSACTION);
  try {
    if (dbType === "mysql" || dbType === "mariadb") {
      await SqlDataSource.rawQuery(`SET FOREIGN_KEY_CHECKS = 0;`);
    }

    await SqlDataSource.rawQuery(dropAllTablesTemplate);

    if (dbType === "mysql" || dbType === "mariadb") {
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
