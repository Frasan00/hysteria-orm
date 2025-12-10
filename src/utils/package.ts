import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
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
  const devDependencies = ["bundle-require", "typescript", "esbuild"];

  let driverDependency = "";
  switch (type) {
    case "mariadb":
    case "mysql":
      driverDependency = "mysql2";
      break;
    case "cockroachdb":
    case "postgres":
      driverDependency = "pg";
      devDependencies.push("@types/pg");
      break;
    case "sqlite":
      driverDependency = "sqlite3";
      break;
    case "mongo":
      driverDependency = "mongodb";
      break;
    case "redis":
      driverDependency = "ioredis";
      break;
    case "mssql":
      driverDependency = "mssql";
      devDependencies.push("@types/mssql");
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
