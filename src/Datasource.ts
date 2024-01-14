import { Model } from "./Mysql/Models/Model";
import { ModelManager } from "./Mysql/Models/ModelManager/ModelManager";

/*
 * Creates a datasource for the selected database type with the provided credentials
 */
type DatasourceType = "mysql";

export interface DatasourceInput {
  readonly type: DatasourceType;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly logs?: boolean;
}

export abstract class Datasource {
  protected type: DatasourceType;
  protected host: string;
  protected port: number;
  protected username: string;
  protected password: string;
  protected database: string;
  protected logs: boolean;

  protected constructor(input: DatasourceInput) {
    this.type = input.type;
    this.host = input.host;
    this.port = input.port;
    this.username = input.username;
    this.password = input.password;
    this.database = input.database;
    this.logs = input.logs || false;
  }

  public abstract connect(): Promise<void>;
  public abstract getModelManager(model: typeof Model): ModelManager<Model>;
}
