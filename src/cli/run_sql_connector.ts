import fs from "node:fs";
import { type SqlDataSource } from "../sql/sql_data_source";
import logger from "../utils/logger";
import path from "node:path";

export default async function runSqlConnector(
  sql: string,
  sqlDataSource: SqlDataSource,
  out?: string,
): Promise<void> {
  const databaseType = sqlDataSource.getDbType();
  logger.info(`Running sql for ${databaseType}`);
  const result = await sqlDataSource.rawQuery(sql);
  logger.info("Sql ran successfully");
  if (out) {
    const fileDir = path.dirname(out);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    logger.info(`Query result saved to ${out}`);
    return;
  }

  logger.info(JSON.stringify(result, null, 2));
  await sqlDataSource.disconnect();
}
