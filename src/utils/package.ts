import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { sqlDatabaseTypes } from "../cli";
import { DataSourceType } from "../data_source/data_source_types";
import logger from "./logger";
import pkg from "../../package.json";

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

/**
 * Prompts user for confirmation and executes a command if approved
 * @param command - The command to execute
 * @param packageManager - The package manager name (e.g., "npm", "yarn")
 * @param dependencies - Array of dependencies to display
 * @param options - execSync options
 * @returns Promise that resolves to true if executed, false if skipped
 */
export const execWithPrompt = async (
  command: string,
  packageManager: string,
  dependencies: string[],
  options?: Parameters<typeof execSync>[1],
): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const dependenciesList = dependencies.join(", ");
  const prompt = `Do you want to install the following dependencies using ${packageManager}?\n${dependenciesList}\n(y/n): `;

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();

      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        execSync(command, options);
        resolve(true);
        return;
      }

      resolve(false);
    });
  });
};

const deps = pkg.devDependencies;

export const installBaseDependencies = async (
  packageManager: string,
  packageManagerCommand: string,
  type: DataSourceType | "redis",
): Promise<void> => {
  const devDependencies = sqlDatabaseTypes.includes(type)
    ? [`typescript@${deps.typescript}`, `esbuild@${deps.esbuild}`]
    : [];

  let driverDependency = "";
  switch (type) {
    case "mariadb":
    case "mysql":
      driverDependency = `mysql2@${deps.mysql2}`;
      break;
    case "cockroachdb":
    case "postgres":
      driverDependency = `pg@${deps.pg}`;
      devDependencies.push(`@types/pg@${deps["@types/pg"]}`);
      break;
    case "sqlite":
      driverDependency = `sqlite3@${deps.sqlite3}`;
      devDependencies.push(`@types/sqlite3@${deps["@types/sqlite3"]}`);
      break;
    case "mongo":
      driverDependency = `mongodb@${deps.mongodb}`;
      devDependencies.push(`@types/mongodb@${deps["@types/mongodb"]}`);
      break;
    case "redis":
      driverDependency = `ioredis@${deps.ioredis}`;
      devDependencies.push(`@types/ioredis@${deps["@types/ioredis"]}`);
      break;
    case "mssql":
      driverDependency = `mssql@${deps.mssql}`;
      devDependencies.push(`@types/mssql@${deps["@types/mssql"]}`);
      break;
    case "oracledb":
      driverDependency = `oracledb@${deps.oracledb}`;
      devDependencies.push(`@types/oracledb@${deps["@types/oracledb"]}`);
      break;
    default:
      throw new Error(`Invalid database type: ${type}`);
  }

  if (driverDependency) {
    const driverInstalled = await execWithPrompt(
      `${packageManager} ${packageManagerCommand} ${driverDependency}`,
      packageManager,
      [driverDependency],
      { stdio: "inherit" },
    );

    if (driverInstalled) {
      logger.info("Driver dependency installed successfully");
    }

    if (!driverInstalled) {
      logger.info("Driver dependency installation skipped");
    }
  }

  const devFlag = packageManager === "deno" ? "--dev" : "-D";
  if (devDependencies.length) {
    const devInstalled = await execWithPrompt(
      `${packageManager} ${packageManagerCommand} ${devDependencies.join(" ")} ${devFlag}`,
      packageManager,
      devDependencies,
      { stdio: "inherit" },
    );

    if (devInstalled) {
      logger.info("Dev dependencies installed successfully");
    }

    if (!devInstalled) {
      logger.info("Dev dependencies installation skipped");
    }
  }
};
