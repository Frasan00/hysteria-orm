"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Column = void 0;
class Column {
    constructor(input) {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "length", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 100
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = input.name;
        this.type = input.type;
        this.length = input.length;
        this.config = input.config;
    }
    getColumn() {
        return this;
    }
}
exports.Column = Column;
