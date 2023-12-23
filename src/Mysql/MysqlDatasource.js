import { Datasource } from "../Datasource";
import { createPool } from "mysql2/promise";
import { ModelManager } from "./Models/ModelManager/ModelManager";
export class MysqlDatasource extends Datasource {
    constructor(input) {
        super(input);
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "migrationsPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.migrationsPath = input.migrationsPath;
    }
    async connect() {
        this.pool = createPool({
            host: this.host,
            port: this.port,
            user: this.username,
            password: this.password,
            database: this.database,
        });
    }
    async getRawConnection() {
        return createPool({
            host: this.host,
            port: this.port,
            user: this.username,
            password: this.password,
            database: this.database,
        });
    }
    getModelManager(model) {
        return new ModelManager(model, this.pool, this.logs);
    }
}
