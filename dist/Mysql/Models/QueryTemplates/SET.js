"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setTemplate = (table) => {
    return {
        set: (column, value) => `\nSET ${column} = ${value} `,
        setMulti: (columns, values) => `\nSET ${columns.join(", ")} = ${values.join(", ")} `,
    };
};
exports.default = setTemplate;
