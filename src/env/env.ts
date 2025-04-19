import fs from "node:fs";
import type { Env } from "./env_types";

const envBase: Env = {
  DB_TYPE: process.env.DB_TYPE,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,
  DB_LOGS: process.env.DB_LOGS === "true",
  MIGRATION_PATH: process.env.MIGRATION_PATH || "migrations",

  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DATABASE: process.env.REDIS_DATABASE,

  MONGO_URL: process.env.MONGO_URL,
  MONGO_LOGS: process.env.MONGO_LOGS === "true",
};

const fillEnvWithDatabaseEnvs = (): Env => {
  try {
    const envs = fs.readFileSync(".env", "utf8");
    const envVars = envs.split("\n");
    envVars.forEach((envVar) => {
      const [key, value] = envVar.split("=");
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      switch (trimmedKey) {
        case "DB_TYPE":
          envBase.DB_TYPE ||= trimmedValue;
          break;
        case "DB_HOST":
          envBase.DB_HOST ||= trimmedValue;
          break;
        case "DB_PORT":
          envBase.DB_PORT ||= trimmedValue;
          break;
        case "DB_USER":
          envBase.DB_USER ||= trimmedValue;
          break;
        case "DB_PASSWORD":
          envBase.DB_PASSWORD ||= trimmedValue;
          break;
        case "DB_DATABASE":
          envBase.DB_DATABASE ||= trimmedValue;
          break;
        case "MIGRATION_PATH":
          envBase.MIGRATION_PATH ||= trimmedValue || "migrations";
          break;

        case "REDIS_HOST":
          envBase.REDIS_HOST ||= trimmedValue;
          break;
        case "REDIS_PORT":
          envBase.REDIS_PORT ||= trimmedValue;
          break;
        case "REDIS_USERNAME":
          envBase.REDIS_USERNAME ||= trimmedValue;
          break;
        case "REDIS_PASSWORD":
          envBase.REDIS_PASSWORD ||= trimmedValue;
          break;
        case "REDIS_DATABASE":
          envBase.REDIS_DATABASE ||= trimmedValue;
          break;

        case "MONGO_URL":
          envBase.MONGO_URL ||= trimmedValue;
          break;
      }
    });
  } catch (error) {
  } finally {
    return envBase;
  }
};

export const env = fillEnvWithDatabaseEnvs();
