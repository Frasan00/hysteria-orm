"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mysqlConfig = void 0;
const { MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
if (!MYSQL_HOST)
    throw new Error("MYSQL_HOST not found");
if (!MYSQL_PORT)
    throw new Error("MYSQL_PORT not found");
if (!MYSQL_USERNAME)
    throw new Error("MYSQL_USERNAME not found");
if (!MYSQL_PASSWORD)
    throw new Error("MYSQL_PASSWORD not found");
if (!MYSQL_DATABASE)
    throw new Error("MYSQL_DATABASE not found");
exports.mysqlConfig = {
    type: 'mysql',
    host: MYSQL_HOST,
    port: +MYSQL_PORT,
    username: MYSQL_USERNAME,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    logs: true,
};
