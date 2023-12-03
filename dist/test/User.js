"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const Model_1 = require("../Mysql/Models/Model");
class User extends Model_1.Model {
    constructor() {
        super();
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.User = User;
