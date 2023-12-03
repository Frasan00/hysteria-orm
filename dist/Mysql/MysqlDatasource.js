"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlDatasource = void 0;
const Datasource_1 = require("../Datasources/Datasource");
const promise_1 = require("mysql2/promise");
const ModelManager_1 = require("./Models/ModelManager/ModelManager");
const MigrationController_1 = require("./Migrations/MigrationController");
class MysqlDatasource extends Datasource_1.Datasource {
    constructor(input) {
        super(input);
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.pool = (0, promise_1.createPool)({
                host: this.host,
                port: this.port,
                user: this.username,
                password: this.password,
                database: this.database,
            });
        });
    }
    getRawConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, promise_1.createPool)({
                host: this.host,
                port: this.port,
                user: this.username,
                password: this.password,
                database: this.database,
            });
        });
    }
    getModelManager(model) {
        return new ModelManager_1.ModelManager(model, this.pool, this.logs);
    }
    getMigrationController(logs) {
        return __awaiter(this, void 0, void 0, function* () {
            return new MigrationController_1.MigrationController({
                mysqlConnection: this.pool,
                logs: logs,
            });
        });
    }
}
exports.MysqlDatasource = MysqlDatasource;
