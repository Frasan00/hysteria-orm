import fs from "fs/promises";
import { createSqlPool } from "../sql/sql_connection_utils";
import { type SqlDataSource } from "../sql/sql_data_source";
import { SqlDataSourceType } from "../sql/sql_data_source_types";
import { Transaction } from "../sql/transactions/transaction";
import logger from "../utils/logger";
import MigrationTemplates from "./resources/migration_templates";

export default async function dropAllTablesConnector(
  sql: SqlDataSource,
  shouldExit: boolean = true,
  transactional?: boolean,
) {
  const dbType = sql.getDbType();
  const dbDatabase = sql.database;
  if (!dbType) {
    logger.error("DB_TYPE is not set could not drop all tables");
    process.exit(1);
  }

  if (!dbDatabase) {
    logger.error("DB_DATABASE is not set could not drop all tables");
    process.exit(1);
  }

  logger.info("Dropping all tables for database type: " + dbType);
  if (dbType === "sqlite") {
    await sql.closeConnection();

    await fs.rm(dbDatabase as string, { recursive: true, force: true });
    logger.info("Sqlite database dropped successfully");
    await fs.writeFile(dbDatabase as string, "");
    logger.info("Sqlite database recreated successfully");

    const details = sql.getConnectionDetails();
    sql.sqlPool = await createSqlPool(sql.getDbType(), details);

    if (shouldExit) {
      await sql.closeConnection();
      logger.info("All tables dropped successfully");
      shouldExit && process.exit(0);
    }
    return;
  }

  const templates = MigrationTemplates.getAllTablesTemplate(
    dbType as SqlDataSourceType,
    dbDatabase as string,
  );

  const tables: string[] = await sql.rawQuery(templates);
  const parsedTables = MigrationTemplates.parseGetAllTables(
    dbType as SqlDataSourceType,
    dbDatabase as string,
    tables,
  );

  if (!parsedTables.length) {
    logger.info("No tables to drop");
    if (shouldExit) {
      await sql.closeConnection();
      process.exit(0);
    }
    return;
  }

  const dropAllTablesTemplate = MigrationTemplates.dropAllTablesTemplate(
    dbType as SqlDataSourceType,
    parsedTables,
  );

  let trx: Transaction | null = null;
  const shouldUseTransaction = transactional && dbType !== "mssql";
  if (shouldUseTransaction) {
    trx = await sql.startTransaction();
    sql = trx.sql as SqlDataSource;
  }

  try {
    if (dbType === "mysql" || dbType === "mariadb") {
      await sql.rawQuery(`SET FOREIGN_KEY_CHECKS = 0;`);
    }

    if (dbType === "mssql") {
      const fkConstraints = await sql.rawQuery<
        { table_name: string; constraint_name: string }[]
      >(`
        SELECT
          OBJECT_NAME(parent_object_id) AS table_name,
          name AS constraint_name
        FROM sys.foreign_keys;
      `);
      for (const fk of fkConstraints) {
        await sql.rawQuery(
          `ALTER TABLE [${fk.table_name}] DROP CONSTRAINT [${fk.constraint_name}];`,
        );
      }
    }

    await sql.rawQuery(dropAllTablesTemplate);

    if (dbType === "mysql" || dbType === "mariadb") {
      await sql.rawQuery(`SET FOREIGN_KEY_CHECKS = 1;`);
    }

    if (shouldUseTransaction) {
      await trx?.commit();
    }
  } catch (error: any) {
    if (shouldUseTransaction) {
      await trx?.rollback();
    }

    logger.error(error);
    process.exit(1);
  } finally {
    if (shouldExit) {
      await sql.closeConnection();
    }
  }

  logger.info("All tables dropped successfully");
  shouldExit && process.exit(0);
}
