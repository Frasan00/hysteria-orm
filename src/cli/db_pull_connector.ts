import fs from "node:fs";
import path from "node:path";
import { SqlDataSource, logger } from "..";
import { TableSchemaInfo } from "../sql/schema_introspection_types";
import {
  generateFileName,
  generateModelName,
} from "./resources/db_pull_naming";
import {
  generateIndexTs,
  generateModelCode,
} from "./resources/model_code_generator";

export interface DbPullOptions {
  outDir: string;
  naming: "camel" | "snake" | "pascal";
  dry: boolean;
}

const SYSTEM_TABLE_PREFIXES = [
  "pg_",
  "information_schema",
  "mysql",
  "sys",
  "performance_schema",
  "sqlite_",
];

function isSystemTable(tableName: string): boolean {
  const lowerName = tableName.toLowerCase();
  return SYSTEM_TABLE_PREFIXES.some((prefix) => lowerName.startsWith(prefix));
}

export default async function dbPullConnector(
  sqlDs: SqlDataSource,
  options: DbPullOptions,
): Promise<void> {
  const { outDir, naming, dry } = options;

  logger.info("Starting database introspection");

  const dialect = sqlDs.getDbType();
  logger.info(`Database dialect: ${dialect}`);

  // Get all tables from database
  const schemas = await sqlDs.introspectSchema();
  if (!schemas || schemas.length === 0) {
    logger.warn("No tables found in database");
    return;
  }

  const allTables: string[] = [];
  for (const schema of schemas) {
    for (const table of schema.tables) {
      if (!isSystemTable(table.name)) {
        allTables.push(table.name);
      }
    }
  }

  if (allTables.length === 0) {
    logger.warn("No user tables found in database (system tables excluded)");
    return;
  }

  logger.info(`Found ${allTables.length} tables to process`);

  const generatedModels: string[] = [];
  const modelsToWrite: Array<{ fileName: string; content: string }> = [];

  for (const tableName of allTables) {
    logger.info(`Processing table: ${tableName}`);

    try {
      const schema: TableSchemaInfo = await sqlDs.getTableSchema(tableName);

      if (schema.columns.length === 0) {
        logger.warn(`Table ${tableName} has no columns, skipping`);
        continue;
      }

      const modelName = generateModelName(tableName, naming);
      const fileName = generateFileName(modelName, naming);

      const code = generateModelCode(tableName, schema, dialect, { naming });

      generatedModels.push(modelName);

      if (dry) {
        logger.info(`[DRY RUN] Would generate: ${fileName}`);
        logger.info("---");
        logger.info(code);
        logger.info("---");
      } else {
        modelsToWrite.push({ fileName, content: code });
      }
    } catch (error) {
      logger.error(`Failed to process table ${tableName}: ${error}`);
    }
  }

  if (!dry) {
    // Create output directory
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
      logger.info(`Created output directory: ${outDir}`);
    }

    // Write model files
    for (const { fileName, content } of modelsToWrite) {
      const filePath = path.join(outDir, fileName);
      fs.writeFileSync(filePath, content, "utf-8");
      logger.info(`Generated: ${filePath}`);
    }

    // Generate index.ts barrel file
    if (generatedModels.length > 0) {
      const indexContent = generateIndexTs(generatedModels);
      const indexPath = path.join(outDir, "index.ts");
      fs.writeFileSync(indexPath, indexContent, "utf-8");
      logger.info(`Generated: ${indexPath}`);
    }
  }

  logger.info(`\nSummary:`);
  logger.info(`  Tables processed: ${generatedModels.length}`);
  if (dry) {
    logger.info(`  Mode: Dry run (no files written)`);
  } else {
    logger.info(`  Output directory: ${outDir}`);
    logger.info(`  Files generated: ${modelsToWrite.length + 1}`); // +1 for index.ts
  }
}
