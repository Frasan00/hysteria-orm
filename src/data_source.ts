import dotenv from "dotenv";
import {
  MongoClientImport,
  Mysql2Import,
  MysqlCreateConnectionOptions,
  PgClientOptions,
  PgImport,
} from "./drivers/driver_constants";
import { MongoOptions } from "mongodb";

dotenv.config();

/*
 * Creates a datasource for the selected database type with the provided credentials
 */
export type DataSourceType =
  | "mysql"
  | "postgres"
  | "mariadb"
  | "sqlite"
  | "mongo";

/**
 * @description By default the connection details can be provided in the .env file, you can still override each prop with your actual connection details in the input
 */
export interface DataSourceInput {
  type?: DataSourceType;
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
  readonly logs?: boolean;
  readonly mysqlOptions?: MysqlCreateConnectionOptions;
  readonly pgOptions?: PgClientOptions;
  readonly mongoOptions?: MongoOptions;

  /**
   * @description Mongo specific option, sql databases won't use this property
   */
  readonly url?: string;
}
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
    if (this.type === "mongo") {
      this.handleMongoSource(input?.url);
      return;
    }

    this.handleSqlSource(input);
  }

  protected handleMongoSource(url?: string) {
    this.type = "mongo";
  }

  protected handleSqlSource(input?: DataSourceInput) {
    this.type = (input?.type || process.env.DB_TYPE) as DataSourceType;
    this.host = (input?.host || process.env.DB_HOST) as string;
    this.port = +(input?.port as number) || +(process.env.DB_PORT as string);
    this.username = (input?.username || process.env.DB_USER) as string;
    this.password = (input?.password || process.env.DB_PASSWORD) as string;
    this.database = (input?.database || process.env.DB_DATABASE) as string;
    this.logs = input?.logs || process.env.DB_LOGS === "true" || false;

    if (!this.port) {
      switch (this.type) {
        case "mysql":
        case "mariadb":
          this.port = 3306;
          break;
        case "postgres":
          this.port = 5432;
          break;
        case "mongo":
          this.port = 27017;
          break;
        case "sqlite":
          break;
        default:
          throw new Error(
            "Database type not provided in the envs nor in the connection details",
          );
      }
    }
  }
}
