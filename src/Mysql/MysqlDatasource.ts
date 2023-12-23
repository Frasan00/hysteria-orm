import { Datasource, DatasourceInput } from "../Datasource";
import { PoolConnection, Pool, createPool } from "mysql2/promise";
import { Model } from "./Models/Model";
import { ModelManager } from "./Models/ModelManager/ModelManager";

/*
 * Creates a datasource for the selected database type with the provided credentials
 */

type MigrationInput = {
  migrationsPath?: string;
};

export class MysqlDatasource extends Datasource {
  protected pool!: Pool;
  protected connection!: PoolConnection;
  protected migrationsPath?: string;

  constructor(input: DatasourceInput & MigrationInput) {
    super(input);
    this.migrationsPath = input.migrationsPath;
  }

  /**
   * @description Connects to the database establishing a connection pool.
   */
  public async connect(): Promise<void> {
    this.pool = createPool({
      host: this.host,
      port: this.port,
      user: this.username,
      password: this.password,
      database: this.database,
    });
  }

  /**
   * @description Returns raw mysql pool
   */
  public async getRawPool(): Promise<Pool> {
    return createPool({
      host: this.host,
      port: this.port,
      user: this.username,
      password: this.password,
      database: this.database,
    });
  }

  /**
   * @description Returns raw mysql PoolConnection
   */
  public async getRawPoolConnection(): Promise<PoolConnection> {
    return createPool({
      host: this.host,
      port: this.port,
      user: this.username,
      password: this.password,
      database: this.database,
    }).getConnection();
  }

  /**
   * @description Returns model manager for the provided model
   * @param model
   */
  public getModelManager<T extends Model>(model: new () => T): ModelManager<T> {
    return new ModelManager<T>(model, this.pool, this.logs);
  }
}
