"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Datasource = void 0;
class Datasource {
    constructor(input) {
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "host", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "port", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "username", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "password", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "database", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.type = input.type;
        this.host = input.host;
        this.port = input.port;
        this.username = input.username;
        this.password = input.password;
        this.database = input.database;
        this.logs = input.logs || false;
    }
}
exports.Datasource = Datasource;
