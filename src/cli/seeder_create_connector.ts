import fs from "node:fs";
import path from "node:path";
import { SeederTemplates } from "./resources/seeder_templates";
import logger from "../utils/logger";

const seederCreateConnector = (
  name: string,
  javascript: boolean,
  seederPath?: string,
): void => {
  const seedersFolder = seederPath || "database/seeders";
  const extension = javascript ? ".js" : ".ts";
  const timestamp = Date.now();
  const fileName = `${timestamp}_${name}${extension}`;

  if (!fs.existsSync(seedersFolder)) {
    fs.mkdirSync(seedersFolder, { recursive: true });
    logger.info(`Created seeders directory: ${seedersFolder}`);
  }

  const filePath = path.join(seedersFolder, fileName);
  const template = SeederTemplates.seederTemplate();

  fs.writeFileSync(filePath, template);
  logger.info(`Seeder created successfully: ${filePath}`);
};

export default seederCreateConnector;
