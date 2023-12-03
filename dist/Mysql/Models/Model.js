"use strict";
/*
 * Represents a model in the Database
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
class Model {
    constructor(tableName) {
        Object.defineProperty(this, "tableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.tableName = tableName || this.constructor.name;
    }
    toJson() {
        return JSON.stringify(this);
    }
}
exports.Model = Model;
