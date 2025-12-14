import fs from "node:fs";
import path from "node:path";
import { SqlDataSource } from "../sql/sql_data_source";
import { importTsUniversal } from "../utils/importer";
import logger from "../utils/logger";

const runSeedersConnector = async (
  sqlDataSource: SqlDataSource,
  seederPaths: string[],
  tsconfigPath?: string,
): Promise<void> => {
  const filesToRun: Array<{ file: string; folder: string }> = [];

  for (const seederPath of seederPaths) {
    const resolvedPath = path.resolve(process.cwd(), seederPath);

    if (!fs.existsSync(resolvedPath)) {
      logger.error(`Path not found: ${resolvedPath}`);
      process.exit(1);
    }

    const stats = fs.statSync(resolvedPath);

    if (stats.isDirectory()) {
      const files = fs
        .readdirSync(resolvedPath)
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
        .sort();

      for (const file of files) {
        filesToRun.push({ file, folder: resolvedPath });
      }
    } else if (stats.isFile()) {
      const fileName = path.basename(resolvedPath);
      const folderPath = path.dirname(resolvedPath);

      if (fileName.endsWith(".ts") || fileName.endsWith(".js")) {
        filesToRun.push({ file: fileName, folder: folderPath });
      } else {
        logger.error(`File must be a .ts or .js file: ${fileName}`);
        process.exit(1);
      }
    }
  }

  if (!filesToRun.length) {
    logger.info("No seeders found");
    return;
  }

  logger.info(`Found ${filesToRun.length} seeder(s) to run`);

  if (!sqlDataSource.isConnected) {
    await sqlDataSource.connect();
  }

  for (const { file, folder } of filesToRun) {
    try {
      logger.info(`Running seeder: ${file}`);
      const seederFilePath = path.resolve(folder, file);

      const seederModule = await importTsUniversal<{
        default: new (sqlDataSource: SqlDataSource) => {
          run: () => Promise<void>;
        };
      }>(seederFilePath, tsconfigPath);

      if (!seederModule.default) {
        logger.error(`Seeder ${file} does not export a default class`);
        continue;
      }

      const seederInstance = new seederModule.default(sqlDataSource);

      if (typeof seederInstance.run !== "function") {
        logger.error(
          `Seeder ${file} must have a run() method. Make sure it extends BaseSeeder from hysteria-orm`,
        );
        continue;
      }

      await seederInstance.run();
      logger.info(`✓ Completed seeder: ${file}`);
    } catch (error) {
      logger.error(`Failed to run seeder ${file}: ${error}`);
      throw error;
    }
  }

  logger.info("All seeders completed successfully");
};

export default runSeedersConnector;
