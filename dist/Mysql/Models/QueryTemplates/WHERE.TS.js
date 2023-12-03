"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const whereTemplate = () => {
    return {
        where: (column, value) => `\nWHERE ${column} = ${value} `,
        andWhere: (column, value) => ` AND ${column} = ${value} `,
        orWhere: (column, value) => ` OR ${column} = ${value} `,
        whereNot: (column, value) => `\nWHERE ${column} != ${value} `,
        andWhereNot: (column, value) => ` AND ${column} != ${value} `,
        orWhereNot: (column, value) => ` OR ${column} != ${value} `,
        whereNull: (column) => `\nWHERE ${column} IS NULL `,
        whereNotNull: (column) => `\nWHERE ${column} IS NOT NULL `,
        whereLike: (column, value) => `\nWHERE ${column} LIKE ${value} `,
        whereBetween: (column, min, max) => `\nWHERE ${column} BETWEEN ${min} AND ${max} `,
        whereNotBetween: (column, min, max) => `\nWHERE ${column} NOT BETWEEN ${min} AND ${max} `,
    };
};
exports.default = whereTemplate;
