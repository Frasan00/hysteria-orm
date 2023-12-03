"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const joinTemplate = (table) => {
    return {
        innerJoin: (table) => `\nINNER JOIN ${table} `,
        leftJoin: (table) => `\nLEFT JOIN ${table} `,
        rightJoin: (table) => `\nRIGHT JOIN ${table} `,
        joinOn: (column1, column2) => `\nON ${column1} = ${column2} `,
        joinOnTable: (table, column1, column2) => `\nON ${table}.${column1} = ${table}.${column2} `,
    };
};
exports.default = joinTemplate;
