"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SELECT_1 = __importDefault(require("../QueryTemplates/SELECT"));
const WHERE_TS_1 = __importDefault(require("../QueryTemplates/WHERE.TS"));
class ModelManagerUtils {
    parseSelectQueryInput(tableName, input) {
        let query = "";
        query += this.parseSelect(tableName, input);
        query += this.parseWhere(input);
        // to do parse join after relations
        query += this.parseQueryFooter(tableName, input);
        return query;
    }
    parseSelect(tableName, input) {
        const select = (0, SELECT_1.default)(tableName);
        return input.select
            ? select.selectColumns(...input.select)
            : select.selectAll;
    }
    parseWhere(input) {
        const where = (0, WHERE_TS_1.default)();
        if (!input.where) {
            return "";
        }
        let query = "";
        const entries = Object.entries(input.where);
        for (let index = 0; index < entries.length; index++) {
            const [key, value] = entries[index];
            if (index === 0) {
                query += where.where(key, value);
                continue;
            }
            query += where.andWhere(key, value);
        }
        return query;
    }
    parseQueryFooter(tableName, input) {
        const select = (0, SELECT_1.default)(tableName);
        let query = "";
        if (input.offset) {
            query += select.offset(input.offset);
        }
        if (input.groupBy) {
            query += select.groupBy(...input.groupBy);
        }
        if (input.orderBy) {
            query += select.orderBy([...input.orderBy.columns], input.orderBy.type);
        }
        if (input.limit) {
            query += select.limit(input.limit);
        }
        return query;
    }
}
exports.default = new ModelManagerUtils();
