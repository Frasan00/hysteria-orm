import { Table } from "./Table";
import path from "path";
export class Migration {
    constructor() {
        Object.defineProperty(this, "migrationName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: path.basename(__filename)
        });
        Object.defineProperty(this, "tableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "migrationType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rawQuery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
    }
    /**
     * @description Use this method to manage a table in your migration (create, alter, drop)
     * @param tableName
     * @param migrationType
     */
    useTable(tableName, migrationType) {
        this.tableName = tableName;
        this.migrationType = migrationType;
        this.table = new Table(this.tableName, this.migrationType);
    }
    /**
     * @description Use this method to run a raw query in your migration
     * @param query
     */
    useRawQuery(query) {
        this.migrationType = "rawQuery";
        this.rawQuery = query;
    }
}
