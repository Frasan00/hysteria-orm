/*
 * Creates a datasource for the selected database type with the provided credentials
 */
export type DataSourceType = "mysql" | "postgres" | "mariadb";

export interface DataSourceInput {
  type: DataSourceType;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly logs?: boolean;
}

export abstract class Datasource {
  protected type: DataSourceType;
  protected host: string;
  protected port: number;
  protected username: string;
  protected password: string;
  protected database: string;
  protected logs: boolean;

  protected constructor(input: DataSourceInput) {
    if (input.type === "mariadb") {
      input.type = "mysql";
    }

    this.type = input.type;
    this.host = input.host;
    this.port = input.port;
    this.username = input.username;
    this.password = input.password;
    this.database = input.database;
    this.logs = input.logs || false;
  }
}
