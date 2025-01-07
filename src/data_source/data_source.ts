import dotenv from "dotenv";
import { DataSourceInput } from "..";
import {
  DataSourceType,
  MongoDataSourceInput,
  PostgresSqlDataSourceInput,
  MysqlSqlDataSourceInput,
  SqliteDataSourceInput,
} from "./data_source_types";

dotenv.config();

export abstract class DataSource {
  protected type!: DataSourceType;
  protected host!: string;
  protected port!: number;
  protected username!: string;
  protected password!: string;
  protected database!: string;
  protected url!: string;
  logs!: boolean;

  protected constructor(input?: DataSourceInput) {
    switch (input?.type) {
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
        throw new Error("Invalid DataSource Type");
    }
  }

  protected handlePostgresSource(input?: PostgresSqlDataSourceInput) {
    this.type = (input?.type || process.env.DB_TYPE) as DataSourceType;
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
    this.type = (input?.type || process.env.DB_TYPE) as DataSourceType;
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
    this.type = (input?.type || process.env.DB_TYPE) as DataSourceType;
    this.database = (input?.database || process.env.DB_DATABASE) as string;
    this.logs = input?.logs || process.env.DB_LOGS === "true" || false;
  }

  protected handleMongoSource(input?: MongoDataSourceInput) {
    this.type = (input?.type || process.env.DB_TYPE) as DataSourceType;
    this.url = input?.url || (process.env.DB_URL as string);
    this.logs = input?.logs || process.env.DB_LOGS === "true" || false;
  }
}
