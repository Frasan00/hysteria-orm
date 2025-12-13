import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { sqlDatabaseTypes } from "../cli";
import { DataSourceType } from "../data_source/data_source_types";
import logger from "./logger";

export const getPackageManager = (): [string, string] => {
  const hasYarnLock = fs.existsSync(path.join(process.cwd(), "yarn.lock"));
  if (hasYarnLock) {
    return ["yarn", "add"];
  }
  const hasPnpmLock = fs.existsSync(path.join(process.cwd(), "pnpm-lock.yaml"));
  if (hasPnpmLock) {
    return ["pnpm", "add"];
  }
  const hasPackageLock = fs.existsSync(
    path.join(process.cwd(), "package-lock.json"),
  );
  if (hasPackageLock) {
    return ["npm", "install"];
  }
  const hasBunLock = fs.existsSync(path.join(process.cwd(), "bun.lockb"));
  if (hasBunLock) {
    return ["bun", "add"];
  }
  const hasDenoLock = fs.existsSync(path.join(process.cwd(), "deno.lock"));
  if (hasDenoLock) {
    return ["deno", "add"];
  }
  return ["npm", "install"];
};

export const installBaseDependencies = (
  packageManager: string,
  packageManagerCommand: string,
  type: DataSourceType | "redis",
) => {
  const devDependencies = sqlDatabaseTypes.includes(type)
    ? ["bundle-require@^5.1.0", "typescript@^5.9.3", "esbuild@^0.27.0"]
    : [];

  let driverDependency = "";
  switch (type) {
    case "mariadb":
    case "mysql":
      driverDependency = "mysql2@^3.15.3";
      devDependencies.push("@types/mysql2@github:types/mysql2");
      break;
    case "cockroachdb":
    case "postgres":
      driverDependency = "pg@^8.16.3";
      devDependencies.push("@types/pg@^8.16.0");
      break;
    case "sqlite":
      driverDependency = "sqlite3@^5.1.7";
      devDependencies.push("@types/sqlite3@^5.1.0");
      break;
    case "mongo":
      driverDependency = "mongodb@^7.0.0";
      devDependencies.push("@types/mongodb@^4.0.7");
      break;
    case "redis":
      driverDependency = "ioredis@^5.8.2";
      devDependencies.push("@types/ioredis@^5.0.0");
      break;
    case "mssql":
      driverDependency = "mssql@^12.2.0";
      devDependencies.push("@types/mssql@^9.1.8");
      break;
    case "oracledb":
      driverDependency = "oracledb@^6.10.0";
      devDependencies.push("@types/oracledb@^6.10.0");
      break;
    default:
      throw new Error(`Invalid database type: ${type}`);
  }

  logger.info(`installing dev dependencies: ${devDependencies.join(" ")}`);

  const devFlag = packageManager === "deno" ? "--dev" : "-D";

  execSync(
    `${packageManager} ${packageManagerCommand} ${devDependencies.join(" ")} ${devFlag}`,
    { stdio: "inherit" },
  );

  if (driverDependency) {
    logger.info(`installing driver dependency: ${driverDependency}`);
    execSync(`${packageManager} ${packageManagerCommand} ${driverDependency}`, {
      stdio: "inherit",
    });
  }
};
