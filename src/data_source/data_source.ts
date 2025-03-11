import dotenv from "dotenv";
import { DataSourceInput } from "..";
import { HysteriaError } from "../errors/hysteria_error";
import type {
  DataSourceType,
  MongoDataSourceInput,
  PostgresSqlDataSourceInput,
  MysqlSqlDataSourceInput,
  SqliteDataSourceInput,
} from "./data_source_types";

dotenv.config();

export abstract class DataSource {
  declare type: DataSourceType;
  declare host: string;
  declare port: number;
  declare username: string;
  declare password: string;
  declare database: string;
  declare url: string;
  logs!: boolean;

  protected constructor(input?: DataSourceInput) {
    this.type = input?.type || (process.env.DB_TYPE as DataSourceType);
    switch (this.type) {
      case "mongo":
        this.handleMongoSource(input as MongoDataSourceInput);
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
      default:
        throw new HysteriaError(
          `Invalid database type: ${this.type}, please provide a valid database type in your input or in the .env file with the key DB_TYPE
Valid database types are: [mongo, postgres, mysql, mariadb, sqlite]`,
          `UNSUPPORTED_DATABASE_TYPE_${this.type}`,
        );
    }
  }

  protected handlePostgresSource(input?: PostgresSqlDataSourceInput) {
    this.host = (input?.host || process.env.DB_HOST) as string;
    this.port = +(input?.port as number) || +(process.env.DB_PORT as string);
    this.username = (input?.username || process.env.DB_USER) as string;
    this.password = (input?.password || process.env.DB_PASSWORD) as string;
    this.database = (input?.database || process.env.DB_DATABASE) as string;
    this.logs = input?.logs || process.env.DB_LOGS === "true" || false;

    if (!this.port) {
      this.port = 5432;
    }
  }

  protected handleMysqlSource(input?: MysqlSqlDataSourceInput) {
    this.host = (input?.host || process.env.DB_HOST) as string;
    this.port = +(input?.port as number) || +(process.env.DB_PORT as string);
    this.username = (input?.username || process.env.DB_USER) as string;
    this.password = (input?.password || process.env.DB_PASSWORD) as string;
    this.database = (input?.database || process.env.DB_DATABASE) as string;
    this.logs = input?.logs || process.env.DB_LOGS === "true" || false;

    if (!this.port) {
      this.port = 3306;
    }
  }

  protected handleSqliteSource(input?: SqliteDataSourceInput) {
    this.database = (input?.database || process.env.DB_DATABASE) as string;
    this.logs = input?.logs || process.env.DB_LOGS === "true" || false;
  }

  protected handleMongoSource(input?: MongoDataSourceInput) {
    this.url = input?.url || (process.env.MONGO_URL as string);
    this.logs = input?.logs || process.env.MONGO_LOGS === "true" || false;
  }
}
