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
exports.ModelManager = void 0;
const SELECT_1 = __importDefault(require("../QueryTemplates/SELECT"));
const ModelManagerUtils_1 = __importDefault(require("./ModelManagerUtils"));
const Logger_1 = __importDefault(require("../../../Logger"));
const MySqlUtils_1 = __importDefault(require("./MySqlUtils"));
class ModelManager {
    constructor(model, mysqlConnection, logs) {
        Object.defineProperty(this, "logs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mysqlConnection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.logs = logs;
        this.tableName = model.name;
        this.model = model;
        this.mysqlConnection = mysqlConnection;
    }
    find(input) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!input) {
                    const select = (0, SELECT_1.default)(this.tableName);
                    this.log(select.selectAll);
                    const [rows] = yield this.mysqlConnection.query(select.selectAll);
                    return rows.map((row) => MySqlUtils_1.default.convertSqlResultToModel(row, this.model));
                }
                const query = ModelManagerUtils_1.default.parseSelectQueryInput(this.tableName, input);
                this.log(query);
                const [rows] = yield this.mysqlConnection.query(query);
                return rows.map((row) => MySqlUtils_1.default.convertSqlResultToModel(row, this.model));
            }
            catch (error) {
                this.queryError(error);
                throw new Error("Query failed " + error);
            }
        });
    }
    log(query) {
        if (!this.logs) {
            return;
        }
        Logger_1.default.info("\n" + query);
    }
    queryError(error) {
        Logger_1.default.error("Query Failed ", error);
    }
}
exports.ModelManager = ModelManager;
