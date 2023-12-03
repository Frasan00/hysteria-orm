"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selectTemplate = (table) => {
    return {
        selectAll: `SELECT * FROM ${table} `,
        selectById: (id) => `SELECT * FROM ${table} WHERE id = ${id} `,
        selectColumns: (...columns) => `SELECT ${columns.join(", ")} FROM ${table} `,
        selectCount: `SELECT COUNT(*) FROM ${table} `,
        selectDistinct: (...columns) => `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `,
        selectSum: (column) => `SELECT SUM(${column}) FROM ${table} `,
        orderBy: (column, order) => `\nORDER BY ${column.join(", ")} ${order}`,
        groupBy: (...columns) => `\nGROUP BY ${columns.join(", ")} `,
        limit: (limit) => `\nLIMIT ${limit} `,
        offset: (offset) => `\nOFFSET ${offset} `,
    };
};
exports.default = selectTemplate;
