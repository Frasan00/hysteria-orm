"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deleteTemplate = (tableName) => {
    return {
        delete: (column) => `\nDELETE FROM ${tableName} WHERE ${column} = ? `,
    };
};
exports.default = deleteTemplate;
