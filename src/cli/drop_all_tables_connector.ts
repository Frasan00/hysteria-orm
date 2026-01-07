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

  let trx: Transaction | null = null;
  const shouldUseTransaction = transactional && dbType === "postgres";

  try {
    if (dbType === "sqlite") {
      await sql.disconnect();

      await fs.rm(dbDatabase as string, { recursive: true, force: true });
      logger.info("Sqlite database dropped successfully");
      await fs.writeFile(dbDatabase as string, "");
      logger.info("Sqlite database recreated successfully");

      const details = sql.getConnectionDetails();
      sql.sqlPool = await createSqlPool(sql.getDbType(), details);

      logger.info("All tables dropped successfully");
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
      return;
    }

    const dropAllTablesTemplate = MigrationTemplates.dropAllTablesTemplate(
      dbType as SqlDataSourceType,
      parsedTables,
    );
    if (shouldUseTransaction) {
      trx = await sql.transaction();
      sql = trx.sql as SqlDataSource;
    }
    if (dbType === "mysql" || dbType === "mariadb") {
      await sql.rawQuery(`SET FOREIGN_KEY_CHECKS = 0;`);
    }

    if (dbType === "mssql") {
      const fkResult = await sql.rawQuery<any>(`
        SELECT
          OBJECT_NAME(parent_object_id) AS table_name,
          name AS constraint_name
        FROM sys.foreign_keys;
      `);
      const fkConstraints = fkResult.recordset;
      for (const fk of fkConstraints) {
        await sql.rawQuery(
          `ALTER TABLE [${fk.table_name}] DROP CONSTRAINT [${fk.constraint_name}];`,
        );
      }
    }

    if (dbType === "oracledb") {
      const fkResult = await sql.rawQuery<any>(`
        SELECT constraint_name, table_name
        FROM user_constraints
        WHERE constraint_type = 'R'
      `);

      // Oracle rawQuery returns rows as objects with UPPERCASE column names
      for (const fk of fkResult.rows || []) {
        await sql.rawQuery(
          `ALTER TABLE "${fk.TABLE_NAME}" DROP CONSTRAINT "${fk.CONSTRAINT_NAME}"`,
        );
      }

      // Oracle can't execute multiple statements at once, drop each table individually
      for (const table of parsedTables) {
        await sql.rawQuery(`DROP TABLE "${table}" CASCADE CONSTRAINTS PURGE`);
      }
    } else {
      await sql.rawQuery(dropAllTablesTemplate);
    }

    if (dbType === "mysql" || dbType === "mariadb") {
      await sql.rawQuery(`SET FOREIGN_KEY_CHECKS = 1;`);
    }

    if (shouldUseTransaction) {
      await trx?.commit();
    }

    logger.info("All tables dropped successfully");
  } catch (error: any) {
    if (shouldUseTransaction) {
      await trx?.rollback();
    }

    logger.error(error);
    throw error;
  } finally {
    if (shouldExit) {
      await sql.disconnect();
    }
  }
}
