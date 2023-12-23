import { Datasource, DatasourceInput } from "../Datasource";
import mysql, { PoolConnection, Pool, createPool } from "mysql2/promise";
import { Model } from "./Models/Model";
import { ModelManager } from "./Models/ModelManager/ModelManager";
import { MigrationController } from "./Migrations/MigrationController";
import { Migration } from "./Migrations/Migration";

/*
 * Creates a datasource for the selected database type with the provided credentials
 */

type MigrationInput = {
  migrationsPath?: string;
};

export class MysqlDatasource extends Datasource {
  protected pool!: Pool;
  protected migrationsPath?: string;

  constructor(input: DatasourceInput & MigrationInput) {
    super(input);
    this.migrationsPath = input.migrationsPath;
  }

  public async connect(): Promise<void> {
    this.pool = createPool({
      host: this.host,
      port: this.port,
      user: this.username,
      password: this.password,
      database: this.database,
    });
  }

  public async getRawConnection(): Promise<Pool> {
    return createPool({
      host: this.host,
      port: this.port,
      user: this.username,
      password: this.password,
      database: this.database,
    });
  }

  public getModelManager<T extends Model>(model: new () => T): ModelManager<T> {
    return new ModelManager<T>(model, this.pool, this.logs);
  }
}
