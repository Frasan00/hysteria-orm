import { Column } from "./Columns/Column";
import { DropColumn } from "./Columns/DropColumn";
import { ColumnTypeBuilder } from "./Columns/ColumnBuilders/ColumnTypeBuilder";
export class Table {
    constructor(tableName, migrationType) {
        Object.defineProperty(this, "tableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "columnsToAdd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "columnsToAlter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "columnsToDelete", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "dropTable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "truncateTable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "migrationType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.tableName = tableName;
        this.migrationType = migrationType;
    }
    column() {
        const column = new Column();
        return new ColumnTypeBuilder(column, this, this.migrationType);
    }
    dropColumn(columnName, foreignKey) {
        const column = new DropColumn(columnName, foreignKey);
        this.columnsToDelete.push(column);
    }
    drop() {
        this.dropTable = true;
    }
    truncate() {
        this.truncateTable = true;
    }
}
