"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
class Table {
    constructor(tableName) {
        Object.defineProperty(this, "tableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "columns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.tableName = tableName;
    }
}
exports.Table = Table;
