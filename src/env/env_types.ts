export type Env = {
  DB_TYPE?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_DATABASE?: string;
  DB_LOGS?: boolean;
  MIGRATION_PATH: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_USERNAME?: string;
  REDIS_PASSWORD?: string;
  REDIS_DATABASE?: string;
  MONGO_URL?: string;
  MONGO_LOGS?: boolean;
  MSSQL_TRUST_SERVER_CERTIFICATE?: boolean;
};
