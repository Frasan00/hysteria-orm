import { type SqlDataSource } from "../sql/sql_data_source";
import logger from "../utils/logger";

export default async function runSqlConnector(
  sql: string,
  sqlDataSource: SqlDataSource,
): Promise<void> {
  const databaseType = sqlDataSource.getDbType();
  logger.info(`Running sql for ${databaseType}`);
  const result = await sqlDataSource.rawQuery(sql);
  logger.info("Sql ran successfully");
  logger.info(JSON.stringify(result, null, 2));
  await sqlDataSource.disconnect();
}
