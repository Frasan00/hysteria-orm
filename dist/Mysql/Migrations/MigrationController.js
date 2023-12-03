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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationController = void 0;
const Logger_1 = __importDefault(require("../../Logger"));
class MigrationController {
    constructor(input) {
        Object.defineProperty(this, "mysqlConnection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "migrations", {
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
        this.mysqlConnection = input.mysqlConnection;
        this.logs = input.logs;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.migrations) {
                Logger_1.default.info("No migrations to run");
                return;
            }
            try {
                for (const migration of this.migrations) {
                    yield migration.up();
                }
            }
            catch (error) {
                Logger_1.default.error("Failed to run migrations");
                throw new Error("Failed to run migrations" + error);
            }
        });
    }
    runMigration(migration) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield migration.up();
            }
            catch (error) {
                Logger_1.default.error("Failed to run migrations");
                throw new Error("Failed to run migrations" + error);
            }
        });
    }
    rollbackMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.migrations) {
                Logger_1.default.info("No migrations to rollback");
                return;
            }
            try {
                for (const migration of this.migrations) {
                    yield migration.down();
                }
            }
            catch (error) {
                Logger_1.default.error("Failed to run migrations");
                throw new Error("Failed to run migrations" + error);
            }
        });
    }
    rollbackMigration(migration) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield migration.down();
            }
            catch (error) {
                Logger_1.default.error("Failed to run migrations");
                throw new Error("Failed to run migrations" + error);
            }
        });
    }
    getMigrations(migrations) {
        this.migrations = migrations;
        return this;
    }
}
exports.MigrationController = MigrationController;
