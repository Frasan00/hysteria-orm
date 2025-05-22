import { env } from "../env/env";
import { HysteriaError } from "../errors/hysteria_error";
import { SqlDataSource } from "../sql/sql_data_source";
import { SqlDataSourceInput } from "../sql/sql_data_source_types";
import logger from "../utils/logger";

export default async function runSqlConnector(
  sql: string,
  sqlDataSourceInput: Partial<SqlDataSourceInput>,
): Promise<void> {
  const databaseType = env.DB_TYPE;
  if (!databaseType) {
    throw new HysteriaError(
      "RunSqlConnector::runSqlConnector DB_TYPE env not set",
      "ENV_NOT_SET",
    );
  }

  await SqlDataSource.connect({
    type: env.DB_TYPE as SqlDataSourceInput["type"],
    ...sqlDataSourceInput,
  } as SqlDataSourceInput);
  logger.info(`Running sql for ${databaseType}`);
  const result = await SqlDataSource.rawQuery(sql);
  logger.info("Sql ran successfully");
  logger.info(JSON.stringify(result, null, 2));
  await SqlDataSource.disconnect();
}
