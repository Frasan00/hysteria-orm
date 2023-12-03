"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const insertTemplate = (tableName) => {
    return {
        insert: (columns, values) => `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")}) `,
    };
};
exports.default = insertTemplate;
