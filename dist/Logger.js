"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const colors = {
    info: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m'
};
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ level, message, timestamp }) => {
    const color = colors[level] || '\x1b[0m';
    return `${timestamp} ${color}${level}\x1b[0m: ${color}${message}\x1b[0m`;
}));
const consoleTransport = new winston_1.default.transports.Console();
const fileTransport = new winston_1.default.transports.File({ filename: 'logfile.log' });
const logger = winston_1.default.createLogger({
    format: logFormat,
    transports: [consoleTransport, fileTransport],
});
exports.default = logger;
