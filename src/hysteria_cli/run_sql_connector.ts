import dotenv from "dotenv";
import logger from "../utils/logger";
import { SqlDataSource } from "../sql/sql_data_source";

dotenv.config();

export default async function runSqlConnector(sql: string): Promise<void> {
  const databaseType = process.env.DB_TYPE;
  if (!databaseType) {
    throw new Error("Run sql error: DB_TYPE env not set");
  }

  await SqlDataSource.connect();

  logger.info(`Running sql for ${databaseType}`);
  const result = await SqlDataSource.rawQuery(sql);
  logger.info("Sql ran successfully");
  logger.info(JSON.stringify(result, null, 2));
  await SqlDataSource.disconnect();
}
