import { HysteriaError } from "../errors/hysteria_error";
import type {
  DataSourceInput,
  DataSourceType,
  MongoDataSourceInput,
  MssqlDataSourceInput,
  MysqlSqlDataSourceInput,
  PostgresSqlDataSourceInput,
  SqliteDataSourceInput,
} from "./data_source_types";
import { env } from "../env/env";

export abstract class DataSource {
  declare type: DataSourceType;
  declare host: string;
  declare port: number;
  declare username: string;
  declare password: string;
  declare database: string;
  declare url: string;
  declare logs: boolean;

  protected constructor(input?: DataSourceInput) {
    this.type = input?.type || (env.DB_TYPE as DataSourceType);
    switch (this.type) {
      case "mongo":
        this.handleMongoSource(input as MongoDataSourceInput);
        break;
      case "cockroachdb":
        this.handleCockroachdbSource(input as PostgresSqlDataSourceInput);
        break;
      case "postgres":
        this.handlePostgresSource(input as PostgresSqlDataSourceInput);
        break;
      case "mariadb":
      case "mysql":
        this.handleMysqlSource(input as MysqlSqlDataSourceInput);
        break;
      case "sqlite":
        this.handleSqliteSource(input as SqliteDataSourceInput);
        break;
      case "mssql":
        this.handleMssqlSource(input as MssqlDataSourceInput);
        break;
      case "oracledb":
        this.handleOracleDBSource(input as MssqlDataSourceInput);
        break;
      default:
        throw new HysteriaError(
          `Invalid database type: ${this.type}, please provide a valid database type in your input or in the .env file with the key DB_TYPE
Valid database types are: [mongo, postgres, cockroachdb, mysql, mariadb, sqlite]`,
          `UNSUPPORTED_DATABASE_TYPE_${this.type}`,
        );
    }
  }

  protected handleCockroachdbSource(input?: PostgresSqlDataSourceInput) {
    this.host = (input?.host || env.DB_HOST) as string;
    this.port = +(input?.port as number) || +(env.DB_PORT as string);
    this.username = (input?.username || env.DB_USER) as string;
    this.password = (input?.password || env.DB_PASSWORD) as string;
    this.database = (input?.database || env.DB_DATABASE) as string;
    this.logs = input?.logs || env.DB_LOGS || false;

    if (!this.port) {
      this.port = 26257;
    }
  }

  protected handlePostgresSource(input?: PostgresSqlDataSourceInput) {
    this.host = (input?.host || env.DB_HOST) as string;
    this.port = +(input?.port as number) || +(env.DB_PORT as string);
    this.username = (input?.username || env.DB_USER) as string;
    this.password = (input?.password || env.DB_PASSWORD) as string;
    this.database = (input?.database || env.DB_DATABASE) as string;
    this.logs = input?.logs || env.DB_LOGS || false;

    if (!this.port) {
      this.port = 5432;
    }
  }

  protected handleMysqlSource(input?: MysqlSqlDataSourceInput) {
    this.host = (input?.host || env.DB_HOST) as string;
    this.port = +(input?.port as number) || +(env.DB_PORT as string);
    this.username = (input?.username || env.DB_USER) as string;
    this.password = (input?.password || env.DB_PASSWORD) as string;
    this.database = (input?.database || env.DB_DATABASE) as string;
    this.logs = input?.logs || env.DB_LOGS || false;

    if (!this.port) {
      this.port = 3306;
    }
  }

  protected handleSqliteSource(input?: SqliteDataSourceInput) {
    this.database = (input?.database || env.DB_DATABASE) as string;
    this.logs = input?.logs || env.DB_LOGS || false;
  }

  protected handleMongoSource(input?: MongoDataSourceInput) {
    this.url = input?.url || (env.MONGO_URL as string);
    this.logs = input?.logs || env.MONGO_LOGS || false;
  }

  protected handleMssqlSource(input?: MssqlDataSourceInput) {
    this.host = (input?.host || env.DB_HOST) as string;
    this.port = +(input?.port as number) || +(env.DB_PORT as string);
    this.username = (input?.username || env.DB_USER) as string;
    this.password = (input?.password || env.DB_PASSWORD) as string;
    this.database = (input?.database || env.DB_DATABASE) as string;
    this.logs = input?.logs || env.DB_LOGS || false;

    if (!this.port) {
      this.port = 1433;
    }
  }

  protected handleOracleDBSource(input?: MssqlDataSourceInput) {
    this.host = (input?.host || env.DB_HOST) as string;
    this.port = +(input?.port as number) || +(env.DB_PORT as string);
    this.username = (input?.username || env.DB_USER) as string;
    this.password = (input?.password || env.DB_PASSWORD) as string;
    this.database = (input?.database || env.DB_DATABASE) as string;
    this.logs = input?.logs || env.DB_LOGS || false;

    if (!this.port) {
      this.port = 1521;
    }
  }
}
