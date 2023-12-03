"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transactionTemplate = () => {
    return {
        begin: `START TRANSACTION \n`,
        commit: `COMMIT \n`,
        rollback: `ROLLBACK \n`,
    };
};
exports.default = transactionTemplate;
