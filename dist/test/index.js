"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MysqlDatasource_1 = require("../Mysql/MysqlDatasource");
const env_1 = require("./env");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("./User");
dotenv_1.default.config();
const datasource = new MysqlDatasource_1.MysqlDatasource(env_1.mysqlConfig);
datasource.connect()
    .then(() => {
    console.log("connected to mysql");
})
    .catch((error) => {
    console.log(error);
});
const modelManager = datasource.getModelManager(User_1.User);
modelManager.find({
    select: ['id', 'name'],
    orderBy: {
        columns: ['id'],
        type: 'DESC'
    },
    limit: 1,
})
    .then((data) => console.log(data))
    .catch((error) => console.log(error));
