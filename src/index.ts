import "reflect-metadata";
import { DataSourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { Model } from "./Sql/Models/Model";
import {
  belongsTo,
  hasOne,
  hasMany,
  column,
  getRelations,
  getModelColumns,
} from "./Sql/Models/ModelDecorators";
import { Relation } from "./Sql/Models/Relations/Relation";
import { ModelQueryBuilder } from "./Sql/QueryBuilder/QueryBuilder";
import { SqlDataSource } from "./Sql/SqlDatasource";
import { getPrimaryKey } from "./Sql/Models/ModelDecorators";
import { CaseConvention } from "./CaseUtils";
import { PaginatedData, PaginationMetadata } from "./Sql/pagination";
import { ModelDeleteQueryBuilder } from "./Sql/QueryBuilder/DeleteQueryBuilder";
import { ModelUpdateQueryBuilder } from "./Sql/QueryBuilder/UpdateQueryBuilder";
import { RedisOptions } from "ioredis";
import {
  RedisDataSource as Redis,
  RedisGiveable,
  RedisStorable,
} from "./NoSql/Redis/RedisDataSource";
import { DateTime } from "luxon";
import { User } from "../test/sql/Models/User";

// (async () => {
//   const sql = await SqlDataSource.connect({
//     type: "sqlite",
//     database: "sqlite.db",
//     logs: true,
//   });

//   await User.insert({
//     name: "sqlite",
//     email: "user",
//     signupSource: "email",
//     isActive: true,
//   });
//   await sql.closeConnection();
// })();

(async () => {
  const sql = await SqlDataSource.connect({
    type: "mssql",
    host: "localhost",
    port: 1433,
    username: "sa",
    password: "s!wASadsfamfèasp@ßfasngosinam",
    database: "master",
    logs: true,
    mssqlOptions: {
      driver: "msnodesqlv8",
      server: "localhost",
      options: {
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true,
      },
    },
  });

  await sql.closeConnection();
})();

export default {
  // Sql
  Model,
  column,
  belongsTo,
  hasOne,
  hasMany,
  Relation,
  SqlDataSource,
  Migration,
  getRelations,
  getModelColumns,

  // Redis
  Redis,
};

export {
  // Sql
  Model,
  column,
  belongsTo,
  hasOne,
  hasMany,
  Relation,
  SqlDataSource,
  DataSourceInput,
  ModelQueryBuilder,
  ModelDeleteQueryBuilder,
  ModelUpdateQueryBuilder,
  Migration,
  CaseConvention,
  PaginatedData,
  PaginationMetadata,
  getRelations,
  getModelColumns,
  getPrimaryKey,

  // Redis
  Redis,
  RedisGiveable,
  RedisStorable,
  RedisOptions,
};
