import { loadPlatform } from "../platform/platform_adapter";
import type { Env } from "./env_types";

const platform = loadPlatform();

const envBase: Env = {
  DB_TYPE: platform.readEnv("DB_TYPE"),
  DB_HOST: platform.readEnv("DB_HOST"),
  DB_PORT: platform.readEnv("DB_PORT"),
  DB_USER: platform.readEnv("DB_USER"),
  DB_PASSWORD: platform.readEnv("DB_PASSWORD"),
  DB_DATABASE: platform.readEnv("DB_DATABASE"),
  DB_LOGS: platform.readEnv("DB_LOGS") === "true",
  MIGRATION_PATH: platform.readEnv("MIGRATION_PATH") || "database/migrations",

  REDIS_HOST: platform.readEnv("REDIS_HOST"),
  REDIS_PORT: platform.readEnv("REDIS_PORT"),
  REDIS_USERNAME: platform.readEnv("REDIS_USERNAME"),
  REDIS_PASSWORD: platform.readEnv("REDIS_PASSWORD"),
  REDIS_DATABASE: platform.readEnv("REDIS_DATABASE"),

  MONGO_URL: platform.readEnv("MONGO_URL"),
  MONGO_LOGS: platform.readEnv("MONGO_LOGS") === "true",

  MSSQL_TRUST_SERVER_CERTIFICATE:
    platform.readEnv("MSSQL_TRUST_SERVER_CERTIFICATE") === "true" || false,
};

const fillEnvWithDatabaseEnvs = (): Env => {
  try {
    if (!platform.fs.exists(".env")) {
      return envBase;
    }

    const envFile = platform.fs.readFileSync(".env");
    if (!envFile) {
      return envBase;
    }

    const envs = new TextDecoder().decode(envFile);
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
          envBase.MIGRATION_PATH ||= trimmedValue || "database/migrations";
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
        case "MSSQL_TRUST_SERVER_CERTIFICATE":
          envBase.MSSQL_TRUST_SERVER_CERTIFICATE ||= trimmedValue === "true";
          break;
      }
    });
  } catch {
  } finally {
    return envBase;
  }
};

export const env = fillEnvWithDatabaseEnvs();
