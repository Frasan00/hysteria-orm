"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Migration: () => Migration,
  Model: () => Model,
  ModelDeleteQueryBuilder: () => ModelDeleteQueryBuilder,
  ModelUpdateQueryBuilder: () => ModelUpdateQueryBuilder,
  Redis: () => Redis_data_source,
  RedisOptions: () => import_ioredis2.RedisOptions,
  Relation: () => Relation,
  SqlDataSource: () => SqlDataSource,
  belongsTo: () => belongsTo,
  column: () => column,
  default: () => src_default,
  getModelColumns: () => getModelColumns,
  getPrimaryKey: () => getPrimaryKey,
  getRelations: () => getRelations,
  hasMany: () => hasMany,
  hasOne: () => hasOne
});
module.exports = __toCommonJS(src_exports);
var import_reflect_metadata3 = require("reflect-metadata");

// src/data_source.ts
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
var Datasource = class {
  constructor(input) {
    if (this.type === "redis") {
      this.handleRedisSource(input);
      return;
    }
    this.handleSqlSource(input);
  }
  handleRedisSource(input) {
    this.type = "redis";
    this.host = input?.host || process.env.REDIS_HOST;
    this.port = +input?.port || +process.env.REDIS_PORT;
    this.logs = Boolean(input?.logs) || Boolean(process.env.REDIS_LOGS) || false;
    if (!this.port) {
      this.port = 6379;
    }
    if (![this.host].some((connectionDetail) => !connectionDetail)) {
      throw new Error(
        "Missing connection details in the envs or in the connection details"
      );
    }
  }
  handleSqlSource(input) {
    this.type = input?.type || process.env.DB_TYPE;
    this.host = input?.host || process.env.DB_HOST;
    this.port = +input?.port || +process.env.DB_PORT;
    this.username = input?.username || process.env.DB_USER;
    this.password = input?.password || process.env.DB_PASSWORD;
    this.database = input?.database || process.env.DB_DATABASE;
    this.logs = Boolean(input?.logs) || Boolean(process.env.DB_LOGS) || false;
    if (!this.port) {
      switch (this.type) {
        case "mysql":
        case "mariadb":
          this.port = 3306;
          break;
        case "postgres":
          this.port = 5432;
        case "redis":
          this.port = 6379;
        case "sqlite":
          break;
        default:
          throw new Error(
            "Database type not provided in the envs nor in the connection details"
          );
      }
    }
  }
};

// src/sql/migrations/migration.ts
var import_path = __toESM(require("path"));

// src/sql/migrations/schema/schema.ts
var import_dotenv2 = __toESM(require("dotenv"));

// src/sql/resources/migrations/CREATE_TABLE.ts
var createTableTemplate = {
  createTableIfNotExists: (table, dbType) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `CREATE TABLE IF NOT EXISTS \`${table}\` (
`;
      case "postgres":
        return `CREATE TABLE IF NOT EXISTS "${table}" (
`;
      case "sqlite":
        return `CREATE TABLE IF NOT EXISTS "${table}" (
`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  createTable: (table, dbType) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `CREATE TABLE \`${table}\` (
`;
      case "postgres":
        return `CREATE TABLE "${table}" (
`;
      case "sqlite":
        return `CREATE TABLE "${table}" (
`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  createTableEnd: "\n);"
};
var CREATE_TABLE_default = createTableTemplate;

// src/sql/resources/migrations/DROP_TABLE.ts
var dropTableTemplate = (table, ifExists, dbType) => {
  switch (dbType) {
    case "mariadb":
    case "mysql":
      return ifExists ? `DROP TABLE IF EXISTS \`${table}\`` : `DROP TABLE \`${table}\``;
    case "postgres":
      return ifExists ? `DROP TABLE IF EXISTS "${table}"` : `DROP TABLE "${table}"`;
    case "sqlite":
      return ifExists ? `DROP TABLE IF EXISTS "${table}"` : `DROP TABLE "${table}"`;
    default:
      throw new Error("Unsupported database type");
  }
};
var DROP_TABLE_default = dropTableTemplate;

// src/sql/migrations/column/alter_table/column_builder_alter.ts
var import_luxon = require("luxon");

// src/utils/logger.ts
var import_winston = __toESM(require("winston"));
var colors = {
  info: "\x1B[32m",
  warn: "\x1B[33m",
  error: "\x1B[31m"
};
var logFormat = import_winston.default.format.combine(
  import_winston.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  import_winston.default.format.printf(({ level, message, timestamp }) => {
    const color = colors[level] || "\x1B[0m";
    return `${timestamp} ${color}${level}\x1B[0m: ${color}${message}\x1B[0m`;
  })
);
var consoleTransport = new import_winston.default.transports.Console();
var fileTransport = new import_winston.default.transports.File({ filename: "logfile.log" });
var logger = import_winston.default.createLogger({
  format: logFormat,
  transports: [consoleTransport, fileTransport]
});
function log(query, logs, params) {
  if (!logs) {
    return;
  }
  if (params && params.length) {
    params.forEach((param, index) => {
      let formattedParam = null;
      if (typeof param === "string") {
        formattedParam = `'${param}'`;
      } else if (typeof param === "object" && param !== null && Object.keys(param).length > 0) {
        formattedParam = `'${JSON.stringify(param)}'`;
      } else {
        formattedParam = param;
      }
      query = query.replace(/\?/, formattedParam);
      const pgPlaceholder = new RegExp(`\\$${index + 1}`, "g");
      query = query.replace(pgPlaceholder, formattedParam);
    });
  }
  logger.info("\n" + query);
}
function queryError(error) {
  logger.error("query Failed ", error);
}
var logger_default = logger;

// src/sql/migrations/column/create_table/column_options_builder.ts
var ColumnOptionsBuilder = class _ColumnOptionsBuilder {
  constructor(table, queryStatements, partialQuery, sqlType, columnName = "", columnReferences = []) {
    this.table = table;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
    this.columnName = columnName;
    this.columnReferences = columnReferences;
  }
  /**
   * @description Makes the column nullable
   */
  nullable() {
    this.partialQuery += " NULL";
    return new _ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences
    );
  }
  default(value) {
    this.partialQuery += ` DEFAULT ${value}`;
    return new _ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences
    );
  }
  /**
   * @description Makes the column unsigned allowing only positive values
   */
  unsigned() {
    this.partialQuery += " UNSIGNED";
    return new _ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences
    );
  }
  /**
   * @description Makes the column not nullable
   */
  notNullable() {
    this.partialQuery += " NOT NULL";
    return new _ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences
    );
  }
  /**
   * @description Makes the column the primary key
   */
  primary() {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.partialQuery += " PRIMARY KEY";
        return new _ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
          this.columnReferences
        );
      case "postgres":
        this.partialQuery += " PRIMARY KEY";
        return new _ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
          this.columnReferences
        );
      case "sqlite":
        this.partialQuery += " PRIMARY KEY";
        return new _ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName,
          this.columnReferences
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  /**
   * @description Adds an unique constraint
   */
  unique() {
    this.partialQuery += " UNIQUE";
    return new _ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences
    );
  }
  /**
   * @description Adds an auto increment - only for mysql
   */
  autoIncrement() {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.partialQuery += " AUTO_INCREMENT";
        return new _ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType
        );
      case "postgres":
        throw new Error("Auto Increment not supported for PostgreSQL");
      case "sqlite":
        throw new Error("Auto Increment not supported for sqlite");
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  /**
   * @description Adds a foreign key with a specific constraint
   * @param table
   * @param column
   */
  references(table, column2, options) {
    this.columnReferences?.push({
      table,
      column: column2,
      onDelete: options?.onDelete,
      onUpdate: options?.onUpdate
    });
    return new _ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
      this.columnReferences
    );
  }
  /**
   * @description Chains a new column creation
   */
  newColumn() {
    this.partialQuery += ",\n";
    return new ColumnTypeBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType
    );
  }
  /**
   * @description Commits the column creation - if omitted, the migration will be run empty
   */
  commit() {
    if (this.columnReferences.length) {
      this.columnReferences.forEach((reference) => {
        switch (this.sqlType) {
          case "mysql":
          case "mariadb":
            this.partialQuery += `,
CONSTRAINT fk_${this.table}_${this.columnName} FOREIGN KEY (${this.columnName}) REFERENCES ${reference.table}(${reference.column}) ${reference.onDelete ? `ON DELETE ${reference.onDelete}` : ""} ${reference.onUpdate ? `ON UPDATE ${reference.onUpdate}` : ""}`;
            break;
          case "postgres":
            this.partialQuery += `,
CONSTRAINT fk_${this.table}_${this.columnName} FOREIGN KEY (${this.columnName}) REFERENCES ${reference.table}(${reference.column}) ${reference.onDelete ? `ON DELETE ${reference.onDelete}` : ""} ${reference.onUpdate ? `ON UPDATE ${reference.onUpdate}` : ""}`;
            break;
          case "sqlite":
            this.partialQuery += `,
FOREIGN KEY (${this.columnName}) REFERENCES ${reference.table}(${reference.column}) ${reference.onDelete ? `ON DELETE ${reference.onDelete}` : ""} ${reference.onUpdate ? `ON UPDATE ${reference.onUpdate}` : ""}`;
            break;
          default:
            throw new Error("Unsupported SQL type");
        }
      });
    }
    this.partialQuery += "\n";
    this.partialQuery += ");";
    this.queryStatements.push(this.partialQuery);
  }
};

// src/sql/migrations/column/create_table/column_type_builder.ts
var ColumnTypeBuilder = class {
  constructor(table, queryStatements, partialQuery, sqlType) {
    this.table = table;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
    this.columnName = "";
  }
  string(name, length = 255) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  varchar(name, length = 255) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} VARCHAR(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  uuid(name) {
    switch (this.sqlType) {
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} UUID`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(36)`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        logger_default.warn("sqlite does not support UUID, using text instead");
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  tinytext(name) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TINYTEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  mediumtext(name) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMTEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  longtext(name) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} LONGTEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  binary(name, length = 255) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BINARY(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BYTEA`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} BLOB(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  enum(name, values) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} ENUM('${values.join("', '")}')`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT CHECK(${name} IN ('${values.join(
          "', '"
        )}'))`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} CHECK(${name} IN ('${values.join(
          "', '"
        )}'))`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  text(name) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TEXT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  char(name, length = 255) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} CHAR(${length})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  tinyint(name) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} TINYINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} TINYINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  smallint(name) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} SMALLINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  mediumint(name) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} MEDIUMINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  /**
   * @description If using mysql, it will automatically add INT AUTO_INCREMENT
   * @param name
   */
  serial(name) {
    if (this.sqlType === `mysql` || this.sqlType === `mariadb`) {
      this.columnName = name;
      this.partialQuery += `${name} INT AUTO_INCREMENT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName
      );
    }
    if (this.sqlType === `sqlite`) {
      this.columnName = name;
      this.partialQuery += `${name} INTEGER PRIMARY KEY AUTOINCREMENT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName
      );
    }
    this.columnName = name;
    this.partialQuery += `${name} SERIAL`;
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  /**
   * @description If using mysql, it will automatically be converted in BIGINT AUTO_INCREMENT
   * @description If using sqlite, it will automatically be converted in INTEGER PRIMARY KEY AUTOINCREMENT
   * @param name
   */
  bigSerial(name) {
    if (this.sqlType === `mysql` || this.sqlType === `mariadb`) {
      this.columnName = name;
      this.partialQuery += `${name} BIGINT AUTO_INCREMENT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName
      );
    }
    if (this.sqlType === `sqlite`) {
      this.columnName = name;
      this.partialQuery += `${name} INTEGER PRIMARY KEY AUTOINCREMENT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName
      );
    }
    this.columnName = name;
    this.partialQuery += `${name} BIGSERIAL`;
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  integer(name, length) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} INT ${length ? `(${length})` : ""}`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER ${length ? `(${length})` : ""}`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} INTEGER ${length ? `(${length})` : ""}`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  bigInteger(name) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} BIGINT`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  /**
   * @description Alias for integer
   * @param name
   * @returns ColumnOptionsBuilder
   */
  int(name) {
    return this.integer(name);
  }
  /**
   * @description Alias for bigInteger
   * @param name
   * @returns ColumnOptionsBuilder
   */
  bigint(name) {
    return this.bigInteger(name);
  }
  float(name, options = {
    precision: 10,
    scale: 2
  }) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} FLOAT(${options.precision}, ${options.scale})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  decimal(name, options = {
    precision: 10,
    scale: 2
  }) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL(${options.precision}, ${options.scale})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL(${options.precision}, ${options.scale})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} DECIMAL(${options.precision}, ${options.scale})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  double(name, options = {
    precision: 10,
    scale: 2
  }) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} DOUBLE(${options.precision}, ${options.scale})`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} DOUBLE PRECISION`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        this.columnName = name;
        this.partialQuery += `${name} REAL`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  boolean(name) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.columnName = name;
        this.partialQuery += `${name} BOOLEAN`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "postgres":
        this.columnName = name;
        this.partialQuery += `${name} BOOLEAN`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      case "sqlite":
        logger_default.warn(
          "sqlite does not support boolean columns, using integer instead"
        );
        this.columnName = name;
        this.partialQuery += `${name} INTEGER CHECK(${name} IN (0, 1))`;
        return new ColumnOptionsBuilder(
          this.table,
          this.queryStatements,
          this.partialQuery,
          this.sqlType,
          this.columnName
        );
      default:
        throw new Error("Unsupported SQL type");
    }
  }
  date(name, options) {
    if (this.sqlType === "sqlite") {
      logger_default.warn("sqlite does not support date columns, using text instead");
      this.columnName = name;
      this.partialQuery += `${name} TEXT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName
      );
    }
    this.columnName = name;
    this.partialQuery += `${name} DATE`;
    if (options && options.autoCreate) {
      this.partialQuery += " DEFAULT CURRENT_DATE";
    }
    if (options && options.autoUpdate) {
      if (this.sqlType === "postgres") {
        throw new Error(
          "Postgres does not support auto updating a date column"
        );
      }
      this.partialQuery += " ON UPDATE CURRENT_DATE";
    }
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  timestamp(name, options) {
    if (this.sqlType === "sqlite") {
      logger_default.warn(
        "sqlite does not support timestamp columns, using text instead"
      );
      this.columnName = name;
      this.partialQuery += `${name} TEXT`;
      return new ColumnOptionsBuilder(
        this.table,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName
      );
    }
    this.columnName = name;
    this.partialQuery += `${name} TIMESTAMP`;
    if (options && options.autoCreate) {
      this.partialQuery += " DEFAULT CURRENT_TIMESTAMP";
    }
    if (options && options.autoUpdate) {
      if (this.sqlType === "postgres") {
        throw new Error(
          "Postgres does not support auto updating a date column"
        );
      }
      this.partialQuery += " ON UPDATE CURRENT_TIMESTAMP";
    }
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  /**
   * @description EXPERIMENTAL
   * @param name
   */
  jsonb(name) {
    this.columnName = name;
    switch (this.sqlType) {
      case "postgres":
        this.partialQuery += `${name} JSONB`;
        break;
      case "mariadb":
      case "mysql":
        this.partialQuery += `${name} JSON`;
        break;
      case "sqlite":
        logger_default.warn(
          "sqlite does not support jsonb columns, using text instead"
        );
        this.partialQuery += `${name} TEXT`;
        break;
      default:
        throw new Error("Unsupported SQL type");
    }
    return new ColumnOptionsBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
};

// src/sql/migrations/column/alter_table/column_builder_alter.ts
var ColumnBuilderAlter = class {
  constructor(table, queryStatements, partialQuery, sqlType) {
    this.table = table;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
  }
  /**
   * @description Add a new column to the table
   * @param columnName { string }
   * @param {DataType} dataType
   * @param {BaseOptions} options
   */
  addColumn(columnName, dataType, options) {
    let query = `ALTER TABLE ${this.table} ADD COLUMN `;
    const columnsBuilder = new ColumnTypeBuilder("", [], "", this.sqlType);
    switch (dataType) {
      case "uuid":
        columnsBuilder.uuid(columnName);
        break;
      case "varchar":
        columnsBuilder.varchar(columnName, options?.length);
        break;
      case "tinytext":
        columnsBuilder.tinytext(columnName);
        break;
      case "mediumtext":
        columnsBuilder.mediumtext(columnName);
        break;
      case "longtext":
        columnsBuilder.longtext(columnName);
        break;
      case "binary":
        columnsBuilder.binary(columnName, options?.length);
        break;
      case "text":
        columnsBuilder.text(columnName);
        break;
      case "char":
        columnsBuilder.char(columnName, options?.length);
        break;
      case "tinyint":
        columnsBuilder.tinyint(columnName);
        break;
      case "smallint":
        columnsBuilder.smallint(columnName);
        break;
      case "mediumint":
        columnsBuilder.mediumint(columnName);
        break;
      case "integer":
        columnsBuilder.integer(columnName, options?.length);
        break;
      case "bigint":
        columnsBuilder.bigint(columnName);
        break;
      case "float":
        const { precision: floatPrecision = 10, scale: floatScale = 2 } = options || {};
        columnsBuilder.float(columnName, {
          precision: floatPrecision,
          scale: floatScale
        });
        break;
      case "decimal":
        const { precision = 10, scale = 2 } = options || {};
        columnsBuilder.decimal(columnName, {
          precision,
          scale
        });
        break;
      case "double":
        const { precision: doublePrecision = 10, scale: doubleScale = 2 } = options || {};
        columnsBuilder.double(columnName, {
          precision: doublePrecision,
          scale: doubleScale
        });
        break;
      case "boolean":
        columnsBuilder.boolean(columnName);
        break;
      case "jsonb":
        columnsBuilder.jsonb(columnName);
        break;
      default:
        throw new Error("Unsupported data type");
    }
    query += columnsBuilder.partialQuery;
    if (options?.default !== void 0) {
      if (typeof options.default === "string") {
        query += ` DEFAULT '${options.default}'`;
      } else if (options.default instanceof Date) {
        query += ` DEFAULT '${options.default.toISOString()}'`;
      } else if (options.default instanceof import_luxon.DateTime) {
        query += ` DEFAULT '${options.default.toISO()}'`;
      } else if (typeof options.default === "object") {
        query += ` DEFAULT '${JSON.stringify(options.default)}'`;
      } else if (typeof options.default === null) {
        query += " DEFAULT NULL";
      } else {
        query += ` DEFAULT ${options.default}`;
      }
    }
    if (options?.primaryKey) {
      query += " PRIMARY KEY";
    }
    if (options?.unique) {
      query += " UNIQUE";
    }
    if (options?.references) {
      query += ` REFERENCES ${options.references.table}(${options.references.column}) ON DELETE ${options.references.onDelete || "NO ACTION"} ON UPDATE ${options.references.onUpdate || "NO ACTION"}`;
    }
    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in ALTER COLUMN");
        case "sqlite":
          throw new Error("Sqlite does not support AFTER in ALTER COLUMN");
        default:
          throw new Error("Unsupported database type");
      }
    }
    this.partialQuery = query;
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Add a new date column to the table
   * @param columnName { string }
   * @param options { DateOptions }
   */
  addDateColumn(columnName, type, options) {
    let query = `ALTER TABLE ${this.table} ADD COLUMN ${columnName} ${type}`;
    if (options?.autoCreate) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += " DEFAULT CURRENT_TIMESTAMP";
          break;
        case "postgres":
          query += " DEFAULT CURRENT_TIMESTAMP";
          break;
        case "sqlite":
          query += " DEFAULT CURRENT_TIMESTAMP";
          break;
        default:
          throw new Error("Unsupported database type");
      }
    }
    if (options?.autoUpdate) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += " ON UPDATE CURRENT_TIMESTAMP";
          break;
        case "postgres":
          query += " ON UPDATE CURRENT_TIMESTAMP";
          break;
        case "sqlite":
          query += " ON UPDATE CURRENT_TIMESTAMP";
          break;
        default:
          throw new Error("Unsupported database type");
      }
    }
    if (options?.notNullable) {
      query += " NOT NULL";
    }
    if (options?.default !== void 0) {
      if (typeof options.default === "string") {
        query += ` DEFAULT '${options.default}'`;
      } else if (options.default instanceof Date) {
        query += ` DEFAULT '${options.default.toISOString()}'`;
      } else {
        query += ` DEFAULT '${options.default.toISO()}'`;
      }
    }
    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          query += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in ALTER COLUMN");
        case "sqlite":
          throw new Error("Sqlite does not support AFTER in ALTER COLUMN");
        default:
          throw new Error("Unsupported database type");
      }
    }
    this.partialQuery = query;
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Add a new enum column to the table
   * @param columnName { string }
   * @param values { string[] }
   * @param options { afterColumn?: string; notNullable?: boolean }
   */
  addEnumColumn(columnName, values, options) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        const parsedValues = values.map((value) => {
          if (typeof value === "number") {
            return value;
          } else if (typeof value === "boolean") {
            return value ? 1 : 0;
          } else if (typeof value === "string") {
            return `'${value}'`;
          }
        });
        this.partialQuery = `ALTER TABLE ${this.table} ADD COLUMN ${columnName} ENUM(${parsedValues.join(", ")})`;
        break;
      case "postgres":
        const enumTypeName = `${this.table}_${columnName}_enum`;
        const parsedValuesPg = values.map((value) => {
          if (typeof value === "number") {
            return value;
          } else if (typeof value === "boolean") {
            return value ? 1 : 0;
          } else if (typeof value === "string") {
            return `'${value}'`;
          }
        });
        this.partialQuery = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumTypeName}') THEN
    CREATE TYPE ${enumTypeName} AS ENUM(${parsedValuesPg.join(", ")});
  END IF;
END $$;
ALTER TABLE ${this.table} ADD COLUMN ${columnName} ${enumTypeName}
      `;
        break;
      case "sqlite":
        const parsedValuesSqlite = values.map((value) => {
          if (typeof value === "number") {
            return value;
          } else if (typeof value === "boolean") {
            return value ? 1 : 0;
          } else if (typeof value === "string") {
            return `'${value}'`;
          }
        });
        this.partialQuery = `ALTER TABLE ${this.table} ADD COLUMN ${columnName} TEXT ${options?.notNullable ? "NOT NULL" : ""} DEFAULT ${options?.default ? `'${options.default}'` : "NULL"} CHECK (${columnName} IN (${parsedValuesSqlite.join(", ")}))`;
        break;
      default:
        throw new Error("Unsupported database type");
    }
    if (options?.notNullable && this.sqlType !== "sqlite") {
      this.partialQuery += " NOT NULL";
    }
    if (options?.default && this.sqlType !== "sqlite") {
      this.partialQuery += ` DEFAULT '${options.default}'`;
    }
    if (options?.unique) {
      this.partialQuery += " UNIQUE";
    }
    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          this.partialQuery += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in AFTER COLUMN");
        case "sqlite":
          throw new Error("Sqlite does not support AFTER in AFTER COLUMN");
        default:
          throw new Error("Unsupported database type");
      }
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Drops a column from the table
   * @param columnName
   */
  dropColumn(columnName) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} DROP COLUMN ${columnName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} DROP COLUMN ${columnName}`;
        break;
      case "sqlite":
        this.partialQuery = `ALTER TABLE ${this.table} DROP COLUMN ${columnName}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Renames a column
   * @param oldColumnName
   * @param newColumnName
   */
  renameColumn(oldColumnName, newColumnName) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} CHANGE COLUMN ${oldColumnName} ${newColumnName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} RENAME COLUMN ${oldColumnName} TO ${newColumnName}`;
        break;
      case "sqlite":
        this.partialQuery = `ALTER TABLE ${this.table} RENAME COLUMN ${oldColumnName} TO ${newColumnName}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  modifyColumnType(columnName, newDataType, options) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} MODIFY COLUMN ${columnName} ${newDataType}${options && options.length ? `(${options.length})` : ""}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} TYPE ${newDataType}${options && options.length ? `(${options.length})` : ""}`;
        break;
      case "sqlite":
        throw new Error("Sqlite does not support modifying column types");
      default:
        throw new Error("Unsupported database type");
    }
    if (options?.notNullable) {
      this.partialQuery += " NOT NULL";
    }
    if (options?.default !== void 0) {
      this.partialQuery += ` DEFAULT ${options.default}`;
    }
    if (options?.primaryKey) {
      this.partialQuery += " PRIMARY KEY";
    }
    if (options?.unique) {
      this.partialQuery += " UNIQUE";
    }
    if (options?.references) {
      this.partialQuery += ` REFERENCES ${options.references.table}(${options.references.column}) ON DELETE ${options.references.onDelete || "NO ACTION"} ON UPDATE ${options.references.onUpdate || "NO ACTION"}`;
    }
    if (options?.afterColumn) {
      switch (this.sqlType) {
        case "mariadb":
        case "mysql":
          this.partialQuery += ` AFTER ${options.afterColumn}`;
          break;
        case "postgres":
          throw new Error("Postgres does not support AFTER in ALTER COLUMN");
        default:
          throw new Error("Unsupported database type");
      }
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Renames a table
   * @param oldtable
   * @param newtable
   */
  renameTable(oldtable, newtable) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `RENAME TABLE ${oldtable} TO ${newtable}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${oldtable} RENAME TO ${newtable}`;
        break;
      case "sqlite":
        this.partialQuery = `ALTER TABLE ${oldtable} RENAME TO ${newtable}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Set a default value
   * @param columnName
   * @param defaultValue
   */
  setDefaultValue(columnName, defaultValue) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} SET DEFAULT ${defaultValue}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} SET DEFAULT ${defaultValue}`;
        break;
      case "sqlite":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} SET DEFAULT ${defaultValue}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Drop a default value
   * @param columnName
   */
  dropDefaultValue(columnName) {
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} DROP DEFAULT`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} ALTER COLUMN ${columnName} DROP DEFAULT`;
        break;
      case "sqlite":
        throw new Error("Sqlite does not support dropping default values");
      default:
        throw new Error("Unsupported database type");
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Add a foreign key
   * @param columnName
   * @param options
   */
  addForeignKey(columnName, options) {
    if (!options.references) {
      throw new Error(
        "References option must be provided to add a foreign key"
      );
    }
    const fkName = `${this.table}_${columnName}_fk`;
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${options.references.table}(${options.references.column}) ON DELETE ${options.references.onDelete || "NO ACTION"} ON UPDATE ${options.references.onUpdate || "NO ACTION"}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${options.references.table}(${options.references.column}) ON DELETE ${options.references.onDelete || "NO ACTION"} ON UPDATE ${options.references.onUpdate || "NO ACTION"}`;
        break;
      case "sqlite":
        this.partialQuery = `ALTER TABLE ${this.table} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) REFERENCES ${options.references.table}(${options.references.column}) ON DELETE ${options.references.onDelete || "NO ACTION"} ON UPDATE ${options.references.onUpdate || "NO ACTION"}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Drop a foreign key
   * @param columnName
   */
  dropForeignKey(columnName) {
    const fkName = `${this.table}_${columnName}_fk`;
    switch (this.sqlType) {
      case "mariadb":
      case "mysql":
        this.partialQuery = `ALTER TABLE ${this.table} DROP FOREIGN KEY ${fkName}`;
        break;
      case "postgres":
        this.partialQuery = `ALTER TABLE ${this.table} DROP CONSTRAINT ${fkName}`;
        break;
      case "sqlite":
        this.partialQuery = `ALTER TABLE ${this.table} DROP CONSTRAINT ${fkName}`;
        break;
      default:
        throw new Error("Unsupported database type");
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Commits the changes - if omitted, the migration will be run empty
   */
  commit() {
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
  }
};

// src/sql/migrations/column/create_table/column_builder_connector.ts
var ColumnBuilderConnector = class {
  constructor(table, queryStatements, partialQuery, sqlType) {
    this.table = table;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
  }
  newColumn() {
    return new ColumnTypeBuilder(
      this.table,
      this.queryStatements,
      this.partialQuery,
      this.sqlType
    );
  }
};

// src/sql/migrations/schema/schema.ts
import_dotenv2.default.config();
var Schema = class {
  constructor(sqlType) {
    this.queryStatements = [];
    this.sqlType = sqlType || process.env.DB_TYPE || "mysql";
  }
  /**
   * @description Add raw query to the migration
   * @param query
   */
  rawQuery(query) {
    this.queryStatements.push(query);
  }
  createTable(table, options) {
    const partialQuery = options && options.ifNotExists ? CREATE_TABLE_default.createTableIfNotExists(table, this.sqlType) : CREATE_TABLE_default.createTable(table, this.sqlType);
    return new ColumnBuilderConnector(
      table,
      this.queryStatements,
      partialQuery,
      this.sqlType
    );
  }
  /**
   * @description Alter table
   * @param table
   * @returns ColumnBuilderAlter
   */
  alterTable(table) {
    return new ColumnBuilderAlter(
      table,
      this.queryStatements,
      "",
      this.sqlType
    );
  }
  /**
   * @description Drop table
   * @param table
   * @param ifExists
   * @returns void
   */
  dropTable(table, ifExists = false) {
    this.rawQuery(DROP_TABLE_default(table, ifExists, this.sqlType));
  }
  /**
   * @description Rename table
   * @param oldtable
   * @param newtable
   * @returns void
   */
  renameTable(oldtable, newtable) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`RENAME TABLE \`${oldtable}\` TO \`${newtable}\``);
        break;
      case "postgres":
        this.rawQuery(`ALTER TABLE "${oldtable}" RENAME TO "${newtable}"`);
        break;
      case "sqlite":
        this.rawQuery(`ALTER TABLE "${oldtable}" RENAME TO "${newtable}"`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
  /**
   * @description Truncate table
   * @param table
   * @returns void
   */
  truncateTable(table) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`TRUNCATE TABLE \`${table}\``);
        break;
      case "postgres":
        this.rawQuery(`TRUNCATE TABLE "${table}"`);
        break;
      case "sqlite":
        this.rawQuery(`DELETE FROM "${table}"`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
  /**
   * @description Create index on table
   * @param table
   * @param indexName
   * @param columns
   * @param unique
   * @returns void
   */
  createIndex(table, indexName, columns, unique = false) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `CREATE ${unique ? "UNIQUE" : ""} INDEX ${indexName} ON \`${table}\` (${columns.join(", ")})`
        );
        break;
      case "postgres":
        this.rawQuery(
          `CREATE ${unique ? "UNIQUE" : ""} INDEX ${indexName} ON "${table}" (${columns.join(", ")})`
        );
        break;
      case "sqlite":
        this.rawQuery(
          `CREATE ${unique ? "UNIQUE" : ""} INDEX ${indexName} ON "${table}" (${columns.join(", ")})`
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
  /**
   * @description Drop index on table
   * @param table
   * @param indexName
   * @returns void
   */
  dropIndex(table, indexName) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`DROP INDEX \`${indexName}\` ON \`${table}\``);
        break;
      case "postgres":
        this.rawQuery(`DROP INDEX ${indexName}`);
        break;
      case "sqlite":
        this.rawQuery(`DROP INDEX ${indexName}`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
  /**
   * @description Adds a primary key to a table
   * @param table
   * @param columnName
   * @param type
   * @param options
   * @returns void
   */
  addPrimaryKey(table, columns) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${table}\` ADD PRIMARY KEY (${columns.join(", ")})`
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD PRIMARY KEY (${columns.join(", ")})`
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD PRIMARY KEY (${columns.join(", ")})`
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
  /**
   * @description Drops a primary key from a table
   * @param table
   * @returns void
   */
  dropPrimaryKey(table) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`ALTER TABLE \`${table}\` DROP PRIMARY KEY`);
        break;
      case "postgres":
        this.rawQuery(`ALTER TABLE "${table}" DROP CONSTRAINT PRIMARY KEY`);
        break;
      case "sqlite":
        this.rawQuery(`ALTER TABLE "${table}" DROP PRIMARY KEY`);
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
  /**
   * @description Adds a foreign key to a table
   * @param table
   * @param constraintName
   * @param columns
   * @returns void
   */
  addConstraint(table, constraintName, columns) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${table}\` ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", "
          )}) REFERENCES ${columns[0].split("_")[0]}s(id)`
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", "
          )}) REFERENCES ${columns[0].split("_")[0]}s(id)`
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columns.join(
            ", "
          )}) REFERENCES ${columns[0].split("_")[0]}s(id)`
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
  /**
   * @description Drops a cosntraint from a table
   * @param table
   * @param constraintName
   * @returns void
   */
  dropConstraint(table, constraintName) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${table}\` DROP FOREIGN KEY ${constraintName}`
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${table}" DROP CONSTRAINT ${constraintName}`
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE "${table}" DROP CONSTRAINT ${constraintName}`
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
  /**
   * @description Adds a unique constraint to a table
   * @param table
   * @param constraintName
   * @param columns
   * @returns void
   */
  addUniqueConstraint(table, constraintName, columns) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(
          `ALTER TABLE \`${table}\` ADD CONSTRAINT ${constraintName} UNIQUE (${columns.join(
            ", "
          )})`
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE \`${table}\` ADD CONSTRAINT ${constraintName} UNIQUE (${columns.join(
            ", "
          )})`
        );
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${table}" ADD CONSTRAINT ${constraintName} UNIQUE (${columns.join(
            ", "
          )})`
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
  /**
   * @description Drops a unique constraint from a table
   * @param table
   * @param constraintName
   * @returns void
   */
  dropUniqueConstraint(table, constraintName) {
    switch (this.sqlType) {
      case "mysql":
      case "mariadb":
        this.rawQuery(`ALTER TABLE \`${table}\` DROP INDEX ${constraintName}`);
        break;
      case "postgres":
        this.rawQuery(
          `ALTER TABLE "${table}" DROP CONSTRAINT ${constraintName}`
        );
        break;
      case "sqlite":
        this.rawQuery(
          `ALTER TABLE "${table}" DROP CONSTRAINT ${constraintName}`
        );
        break;
      default:
        throw new Error("Unsupported database type");
    }
  }
};

// src/sql/migrations/migration.ts
var Migration = class {
  constructor() {
    this.migrationName = import_path.default.basename(__filename);
    this.schema = new Schema();
  }
};

// src/sql/models/model.ts
var import_reflect_metadata2 = require("reflect-metadata");
var import_luxon5 = require("luxon");

// src/utils/case_utils.ts
function camelToSnakeCase(camelCase) {
  if (typeof camelCase !== "string" || !camelCase) {
    return camelCase;
  }
  if (camelCase === camelCase.toLowerCase()) {
    return camelCase;
  }
  return camelCase.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
function fromSnakeToCamelCase(snake) {
  if (typeof snake !== "string" || !snake) {
    return snake;
  }
  if (snake === snake.toUpperCase()) {
    return snake;
  }
  return snake.replace(/(_\w)/g, (x) => x[1].toUpperCase());
}
function convertCase(value, to) {
  if (to === "none") {
    return value;
  }
  if (to === "snake") {
    return camelToSnakeCase(value);
  }
  if (to === "camel") {
    return fromSnakeToCamelCase(value);
  }
  if (to instanceof RegExp) {
    return value.replace(to, (x) => x[1].toUpperCase());
  }
  return to(value);
}

// src/utils/json_utils.ts
function isNestedObject(value) {
  return typeof value === "object" && !Array.isArray(value) && value !== null && Object.keys(value).length > 0;
}

// src/sql/models/relations/relation.ts
function isRelationDefinition(originalValue) {
  return originalValue.hasOwnProperty("type") && originalValue.hasOwnProperty("relatedModel") && originalValue.hasOwnProperty("foreignKey");
}
var Relation = class {
  constructor(model, columnName, options) {
    this.model = Model;
    this.columnName = "";
    this.relatedModel = "";
    this.model = model;
    this.columnName = columnName;
    this.relatedModel = this.model.table;
    this.options = options;
  }
};

// src/sql/models/relations/belongs_to.ts
var BelongsTo = class extends Relation {
  constructor(relatedModel, columnName, foreignKey, options) {
    super(relatedModel, columnName, options);
    this.foreignKey = foreignKey;
    this.type = "belongsTo" /* belongsTo */;
  }
};

// src/sql/models/relations/has_many.ts
var HasMany = class extends Relation {
  constructor(relatedModel, columnName, foreignKey, options) {
    super(relatedModel, columnName, options);
    this.type = "hasMany" /* hasMany */;
    this.foreignKey = foreignKey;
    this.type = "hasMany" /* hasMany */;
  }
};

// src/sql/models/relations/has_one.ts
var HasOne = class extends Relation {
  constructor(relatedModel, columnName, foreignKey, options) {
    super(relatedModel, columnName, options);
    this.foreignKey = foreignKey;
    this.type = "hasOne" /* hasOne */;
  }
};

// src/sql/models/model_decorators.ts
var COLUMN_METADATA_KEY = Symbol("columns");
var DYNAMIC_COLUMN_METADATA_KEY = Symbol("dynamicColumns");
var PRIMARY_KEY_METADATA_KEY = Symbol("primaryKey");
var BOOLEAN_COLUMN_METADATA_KEY = Symbol("booleanColumns");
var RELATION_METADATA_KEY = Symbol("relations");
function column(options = { primaryKey: false, booleanColumn: false }) {
  return (target, propertyKey) => {
    if (options.primaryKey) {
      const primaryKey = Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target);
      if (primaryKey) {
        throw new Error("Multiple primary keys are not allowed");
      }
      Reflect.defineMetadata(PRIMARY_KEY_METADATA_KEY, propertyKey, target);
    }
    if (options.booleanColumn) {
      const booleanColumns = Reflect.getMetadata(BOOLEAN_COLUMN_METADATA_KEY, target) || [];
      booleanColumns.push(propertyKey);
      Reflect.defineMetadata(
        BOOLEAN_COLUMN_METADATA_KEY,
        booleanColumns,
        target
      );
    }
    const existingColumns = Reflect.getMetadata(COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(propertyKey);
    Reflect.defineMetadata(COLUMN_METADATA_KEY, existingColumns, target);
  };
}
function dynamicColumn(columnName) {
  return (target, propertyKey) => {
    const dynamicColumn2 = {
      columnName,
      functionName: propertyKey,
      dynamicColumnFn: target.constructor.prototype[propertyKey]
    };
    const existingColumns = Reflect.getMetadata(DYNAMIC_COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(dynamicColumn2);
    Reflect.defineMetadata(
      DYNAMIC_COLUMN_METADATA_KEY,
      existingColumns,
      target
    );
  };
}
function getModelColumns(target) {
  return Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || [];
}
function getModelBooleanColumns(target) {
  return Reflect.getMetadata(BOOLEAN_COLUMN_METADATA_KEY, target.prototype) || [];
}
function belongsTo(model, foreignKey, options) {
  return (target, propertyKey) => {
    const relation = {
      type: "belongsTo" /* belongsTo */,
      columnName: propertyKey,
      model,
      foreignKey,
      options
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function hasOne(model, foreignKey, options) {
  return (target, propertyKey) => {
    const relation = {
      type: "hasOne" /* hasOne */,
      columnName: propertyKey,
      model,
      foreignKey,
      options
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function hasMany(model, foreignKey, options) {
  return (target, propertyKey) => {
    const relation = {
      type: "hasMany" /* hasMany */,
      columnName: propertyKey,
      model,
      foreignKey,
      options
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function getRelations(target) {
  const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target.prototype) || [];
  return relations.map((relation) => {
    const { type, model, columnName, foreignKey, options } = relation;
    switch (type) {
      case "belongsTo" /* belongsTo */:
        return new BelongsTo(model(), columnName, foreignKey, options);
      case "hasOne" /* hasOne */:
        return new HasOne(model(), columnName, foreignKey, options);
      case "hasMany" /* hasMany */:
        return new HasMany(model(), columnName, foreignKey, options);
      default:
        throw new Error(`Unknown relation type: ${type}`);
    }
  });
}
function getPrimaryKey(target) {
  return Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target.prototype);
}
function getDynamicColumns(target) {
  return Reflect.getMetadata(DYNAMIC_COLUMN_METADATA_KEY, target.prototype);
}

// src/sql/serializer.ts
async function parseDatabaseDataIntoModelResponse(models, typeofModel, relationModels = []) {
  if (!models.length) {
    return null;
  }
  const relations = getRelations(typeofModel);
  const serializedModels = models.map((model) => {
    const serializedModel = serializeModel(model, typeofModel);
    processRelation(serializedModel, typeofModel, relations, relationModels);
    addNullModelColumns(typeofModel, serializedModel);
    return serializedModel;
  });
  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
}
function serializeModel(model, typeofModel) {
  const camelCaseModel = {};
  const booleanColumns = getModelBooleanColumns(typeofModel);
  for (const key in model) {
    if (model[key] === void 0) {
      delete model[key];
    }
    if (model.hasOwnProperty(key)) {
      if (key === "extraColumns") {
        processExtraColumns(model, key, camelCaseModel, typeofModel);
        continue;
      }
      const originalValue = model[key];
      if (originalValue == null) {
        camelCaseModel[convertCase(key, typeofModel.modelCaseConvention)] = originalValue;
        continue;
      }
      if (isRelationDefinition(originalValue)) {
        continue;
      }
      const camelCaseKey = convertCase(key, typeofModel.modelCaseConvention);
      if (isNestedObject(originalValue) && !Array.isArray(originalValue)) {
        camelCaseModel[camelCaseKey] = convertToModelCaseConvention(
          originalValue,
          typeofModel
        );
        continue;
      }
      if (Array.isArray(originalValue)) {
        continue;
      }
      if (booleanColumns.includes(camelCaseKey)) {
        camelCaseModel[camelCaseKey] = Boolean(originalValue);
        continue;
      }
      camelCaseModel[camelCaseKey] = originalValue;
    }
  }
  return camelCaseModel;
}
function addNullModelColumns(typeofModel, serializedModel) {
  const columns = getModelColumns(typeofModel);
  columns.forEach((column2) => {
    const casedColumn = convertCase(
      column2,
      typeofModel.modelCaseConvention
    );
    if (serializedModel.hasOwnProperty(column2)) {
      return;
    }
    serializedModel[casedColumn] = null;
  });
}
function processExtraColumns(model, key, camelCaseModel, typeofModel) {
  if (!Object.keys(model[key]).length) {
    return;
  }
  const extraColumns = Object.keys(model[key]).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] = model[key][objKey];
      return acc;
    },
    {}
  );
  camelCaseModel[key] = extraColumns;
}
function processRelation(serializedModel, typeofModel, relations, relationModels) {
  relations.forEach((relation) => {
    const relationModel = relationModels.find(
      (relationModel2) => relationModel2[relation.columnName]
    );
    if (!relationModel) {
      return;
    }
    const relatedModels = relationModel[relation.columnName];
    const foreignKey = convertCase(
      relation.foreignKey,
      typeofModel.modelCaseConvention
    );
    const primaryKey = convertCase(
      typeofModel.primaryKey,
      typeofModel.modelCaseConvention
    );
    switch (relation.type) {
      case "belongsTo" /* belongsTo */:
        const relatedModelMap = /* @__PURE__ */ new Map();
        relatedModels.forEach((model) => {
          relatedModelMap.set(model[primaryKey], model);
        });
        const retrievedRelatedModel = relatedModelMap.get(
          serializedModel[foreignKey]
        );
        if (retrievedRelatedModel) {
          serializedModel[relation.columnName] = serializeModel(
            retrievedRelatedModel,
            relation.model
          );
        }
        break;
      case "hasOne" /* hasOne */:
        const relatedModelMapHasOne = /* @__PURE__ */ new Map();
        relatedModels.forEach((model) => {
          relatedModelMapHasOne.set(model[foreignKey], model);
        });
        const retrievedRelatedModelHasOne = relatedModelMapHasOne.get(
          serializedModel[foreignKey]
        );
        if (retrievedRelatedModelHasOne) {
          serializedModel[relation.columnName] = serializeModel(
            retrievedRelatedModelHasOne,
            relation.model
          );
        }
        break;
      case "hasMany" /* hasMany */:
        const retrievedRelatedModels = relatedModels.filter(
          (item) => (
            // Since it's still raw data and it's not yet been converted to camel case (it will soon in the serializeModel call)m it's matched with the camel case key
            item[convertCase(
              foreignKey,
              typeofModel.databaseCaseConvention
            )] === serializedModel[primaryKey]
          )
        );
        serializedModel[relation.columnName] = retrievedRelatedModels.map(
          (model) => serializeModel(model, relation.model)
        );
        break;
      default:
        throw new Error("Relation type not supported");
    }
  });
}
function convertToModelCaseConvention(originalValue, typeofModel) {
  return Object.keys(originalValue).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] = originalValue[objKey];
      return acc;
    },
    {}
  );
}
async function addDynamicColumnsToModel(typeofModel, model, dynamicColumnsToAdd) {
  const dynamicColumns = getDynamicColumns(typeofModel);
  if (!dynamicColumns || !dynamicColumns.length) {
    return;
  }
  const dynamicColumnMap = /* @__PURE__ */ new Map();
  for (const dynamicColumn2 of dynamicColumns) {
    dynamicColumnMap.set(dynamicColumn2.functionName, {
      columnName: dynamicColumn2.columnName,
      dynamicColumnFn: dynamicColumn2.dynamicColumnFn
    });
  }
  const promises = dynamicColumnsToAdd.map(async (dynamicColumn2) => {
    const dynamic = dynamicColumnMap.get(dynamicColumn2);
    const casedKey = convertCase(
      dynamic?.columnName,
      typeofModel.modelCaseConvention
    );
    Object.assign(model, { [casedKey]: await dynamic?.dynamicColumnFn() });
  });
  await Promise.all(promises);
}

// src/sql/sql_data_source.ts
var import_promise = __toESM(require("mysql2/promise"));
var import_pg = __toESM(require("pg"));
var import_sqlite3 = __toESM(require("sqlite3"));

// src/sql/models/model_manager/model_manager.ts
var ModelManager = class {
  /**
   * @param model
   * @param logs
   * @param sqlDataSource Passed if a custom connection is provided
   */
  constructor(model, logs, sqlDataSource) {
    this.logs = logs;
    this.model = model;
    this.throwError = false;
    this.modelInstance = getBaseModelInstance();
    this.sqlDataSource = sqlDataSource;
  }
};

// src/sql/resources/query/DELETE.ts
var deleteTemplate = (table, dbType) => {
  return {
    delete: (column2, value) => {
      let baseQuery = `DELETE FROM ${table} WHERE ${column2} = PLACEHOLDER`;
      switch (dbType) {
        case "mariadb":
        case "sqlite":
        case "mysql":
          baseQuery = baseQuery.replace("PLACEHOLDER", "?");
          break;
        case "postgres":
          baseQuery = baseQuery.replace("PLACEHOLDER", "$1");
          break;
        default:
          throw new Error("Unsupported database type");
      }
      return { query: baseQuery, params: [value] };
    },
    massiveDelete: (whereClause, joinClause = "") => {
      return `DELETE FROM ${table} ${joinClause} ${whereClause}`;
    }
  };
};
var DELETE_default = deleteTemplate;

// src/sql/resources/query/INSERT.ts
var insertTemplate = (dbType, typeofModel) => {
  const table = typeofModel.table;
  return {
    insert: (columns, values) => {
      columns = columns.map(
        (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
      );
      let placeholders;
      let params;
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          placeholders = columns.map(() => "?").join(", ");
          params = values;
          break;
        case "postgres":
          placeholders = columns.map((_, index) => {
            if (isNestedObject(values[index])) {
              return `$${index + 1}::jsonb`;
            }
            return `$${index + 1}`;
          }).join(", ");
          params = values.map(
            (value) => isNestedObject(value) ? JSON.stringify(value) : value
          );
          break;
        default:
          throw new Error("Unsupported database type");
      }
      const query = dbType !== "postgres" ? `INSERT INTO ${table} (${columns.join(", ")})
VALUES (${placeholders});` : `INSERT INTO ${table} (${columns.join(", ")})
VALUES (${placeholders}) RETURNING *;`;
      return { query, params };
    },
    insertMany: (columns, values) => {
      columns = columns.map(
        (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
      );
      let valueSets;
      let params = [];
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          valueSets = values.map((valueSet) => {
            params.push(...valueSet);
            return `(${valueSet.map(() => "?").join(", ")})`;
          });
          break;
        case "postgres":
          valueSets = values.map((valueSet, rowIndex) => {
            params.push(
              ...valueSet.map(
                (value) => isNestedObject(value) ? JSON.stringify(value) : value
              )
            );
            return `(${valueSet.map((value, colIndex) => {
              if (isNestedObject(value)) {
                return `$${rowIndex * columns.length + colIndex + 1}::jsonb`;
              }
              return `$${rowIndex * columns.length + colIndex + 1}`;
            }).join(", ")})`;
          });
          break;
        default:
          throw new Error("Unsupported database type");
      }
      const query = dbType !== "postgres" ? `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")};` : `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")} RETURNING *;`;
      return { query, params };
    }
  };
};
var INSERT_default = insertTemplate;

// src/sql/resources/query/RELATION.ts
function parseValueType(value) {
  return typeof value;
}
function convertValueToSQL(value, type) {
  switch (type) {
    case "string":
      return `'${value}'`;
    case "number":
    case "boolean":
      return `${value}`;
    default:
      throw new Error(`Unsupported value type: ${type}`);
  }
}
function relationTemplates(models, relation, relationName, typeofModel) {
  const primaryKey = relation.model.primaryKey;
  const foreignKey = relation.foreignKey;
  const relatedModel = relation.relatedModel;
  const primaryKeyValues = models.map((model) => {
    const value = model[convertCase(primaryKey, typeofModel.modelCaseConvention)];
    return { value, type: parseValueType(value) };
  });
  const foreignKeyValues = models.map((model) => {
    const value = model[convertCase(foreignKey, typeofModel.modelCaseConvention)];
    return { value, type: parseValueType(value) };
  });
  const softDeleteColumn = relation.options?.softDeleteColumn;
  const softDeleteQuery = relation.options?.softDeleteType === "date" ? ` AND ${relatedModel}.${convertCase(
    softDeleteColumn,
    typeofModel.databaseCaseConvention
  )} IS NULL` : ` AND ${relatedModel}.${convertCase(
    softDeleteColumn,
    typeofModel.databaseCaseConvention
  )} = false`;
  switch (relation.type) {
    case "hasOne" /* hasOne */:
      if (primaryKeyValues.some(({ value }) => !value)) {
        logger_default.error(
          `Invalid primaryKey values for ${typeofModel.name}, ${primaryKeyValues.map(({ value }) => value).join(", ")}`
        );
        throw new Error(
          `Invalid primaryKey values for ${typeofModel.name}, ${primaryKeyValues.map(({ value }) => value).join(", ")}`
        );
      }
      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention
      )} IN (${primaryKeyValues.map(({ value, type }) => convertValueToSQL(value, type)).join(", ")})${softDeleteColumn ? softDeleteQuery : ""};`;
    case "belongsTo" /* belongsTo */:
      if (foreignKeyValues.some(({ value }) => !value)) {
        logger_default.error(
          `Invalid foreignKey values for ${relatedModel}, ${foreignKeyValues.map(({ value }) => value).join(", ")}`
        );
        throw new Error(
          `Invalid foreignKey values for ${relatedModel}, ${foreignKeyValues.map(({ value }) => value).join(", ")}`
        );
      }
      if (!primaryKey) {
        throw new Error(
          `Related Model ${relatedModel} does not have a primary key`
        );
      }
      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${primaryKey} IN (${foreignKeyValues.map(({ value, type }) => convertValueToSQL(value, type)).join(", ")}) ${softDeleteColumn ? softDeleteQuery : ""};`;
    case "hasMany" /* hasMany */:
      if (primaryKeyValues.some(({ value }) => !value)) {
        logger_default.error(
          `Invalid primaryKey values: ${primaryKeyValues.map(
            ({ value }) => value
          )}`
        );
        throw new Error("Invalid primaryKey values");
      }
      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention
      )} IN (${primaryKeyValues.map(({ value, type }) => convertValueToSQL(value, type)).join(", ")}) ${softDeleteColumn ? softDeleteQuery : ""};`;
    default:
      throw new Error(`Unknown relation type: ${relation.type}`);
  }
}
var RELATION_default = relationTemplates;

// src/sql/resources/query/UPDATE.ts
var updateTemplate = (dbType, typeofModel) => {
  const table = typeofModel.table;
  return {
    update: (columns, values, primaryKey, primaryKeyValue) => {
      if (columns.includes("extraColumns")) {
        const extraColumnsIndex = columns.indexOf("extraColumns");
        columns.splice(columns.indexOf("extraColumns"), 1);
        values.splice(extraColumnsIndex, 1);
      }
      columns = columns.map(
        (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
      );
      let setClause;
      let params;
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns.map((column2) => `\`${column2}\` = ?`).join(", ");
          params = [...values, primaryKeyValue];
          break;
        case "postgres":
          setClause = columns.map((column2, index) => `"${column2}" = $${index + 1}`).join(", ");
          params = [...values, primaryKeyValue];
          break;
        default:
          throw new Error("Unsupported database type");
      }
      const primaryKeyPlaceholder = dbType === "postgres" ? `$${columns.length + 1}` : "?";
      const query = `UPDATE ${table} 
SET ${setClause} 
WHERE ${primaryKey} = ${primaryKeyPlaceholder};`;
      return { query, params };
    },
    massiveUpdate: (columns, values, whereClause, joinClause = "") => {
      columns = columns.map(
        (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
      );
      let setClause;
      const params = [];
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns.map((column2) => `\`${column2}\` = ?`).join(", ");
          values.forEach((value) => {
            params.push(value ?? null);
          });
          break;
        case "postgres":
          setClause = columns.map((column2, index) => `"${column2}" = $${index + 1}`).join(", ");
          values.forEach((value) => {
            params.push(value ?? null);
          });
          break;
        default:
          throw new Error("Unsupported database type");
      }
      const query = `UPDATE ${table} ${joinClause}
SET ${setClause} ${whereClause}`;
      return { query, params };
    }
  };
};
var UPDATE_default = updateTemplate;

// src/sql/models/model_manager/model_manager_utils.ts
var SqlModelManagerUtils = class {
  constructor(dbType, sqlConnection) {
    this.dbType = dbType;
    this.sqlConnection = sqlConnection;
  }
  parseInsert(model, typeofModel, dbType) {
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const insert = INSERT_default(dbType, typeofModel);
    return insert.insert(keys, values);
  }
  parseMassiveInsert(models, typeofModel, dbType) {
    const filteredModels = models.map(
      (m) => this.filterRelationsAndMetadata(m)
    );
    const insert = INSERT_default(dbType, typeofModel);
    const keys = Object.keys(filteredModels[0]);
    const values = filteredModels.map((model) => Object.values(model));
    return insert.insertMany(keys, values);
  }
  parseUpdate(model, typeofModel, dbType) {
    const update = UPDATE_default(dbType, typeofModel);
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const primaryKeyValue = filteredModel[typeofModel.primaryKey];
    return update.update(
      keys,
      values,
      typeofModel.primaryKey,
      primaryKeyValue
    );
  }
  filterRelationsAndMetadata(model) {
    const filteredModel = {};
    const keys = Object.keys(model);
    const isRelation = (value) => value instanceof Relation;
    for (const key of keys) {
      if (isRelation(model[key])) {
        continue;
      }
      Object.assign(filteredModel, { [key]: model[key] });
    }
    return filteredModel;
  }
  parseDelete(table, column2, value) {
    return DELETE_default(table, this.dbType).delete(column2, value);
  }
  getRelationFromModel(relationField, typeofModel) {
    const relations = getRelations(typeofModel);
    const relation = relations.find((r) => r.columnName === relationField);
    if (!relation) {
      throw new Error(
        `Relation ${relationField} not found in model ${typeofModel}`
      );
    }
    return relation;
  }
  // Parses and fills input relations directly into the model
  async parseQueryBuilderRelations(models, typeofModel, input, logs) {
    if (!input.length) {
      return [];
    }
    if (!typeofModel.primaryKey) {
      throw new Error(`Model ${typeofModel} does not have a primary key`);
    }
    let relationQuery = "";
    const relationQueries = [];
    const relationMap = {};
    try {
      input.forEach((inputRelation) => {
        const relation = this.getRelationFromModel(inputRelation, typeofModel);
        const query = RELATION_default(
          models,
          relation,
          inputRelation,
          typeofModel
        );
        relationQueries.push(query);
        relationMap[inputRelation] = query;
      });
      relationQuery = relationQueries.join(" UNION ALL ");
      log(relationQuery, logs);
      let result = await this.getQueryResult(relationQuery);
      result = Array.isArray(result) ? result : [result];
      const resultMap = {};
      result.forEach((row) => {
        const relationName = row.relation_name;
        delete row.relation_name;
        if (!resultMap[relationName]) {
          resultMap[relationName] = [];
        }
        resultMap[relationName].push(row);
      });
      const resultArray = input.map(
        (inputRelation) => {
          const modelsForRelation = resultMap[inputRelation] || [];
          return {
            [inputRelation]: modelsForRelation
          };
        }
      );
      return resultArray;
    } catch (error) {
      queryError("query Error: " + relationQuery + error);
      throw new Error("Failed to parse relations " + error);
    }
  }
  async getQueryResult(query, params = []) {
    switch (this.dbType) {
      case "mysql":
      case "mariadb":
        const resultMysql = await this.sqlConnection.query(query, params);
        return resultMysql[0];
      case "postgres":
        const resultPg = await this.sqlConnection.query(
          query,
          params
        );
        return resultPg.rows;
      case "sqlite":
        return await new Promise((resolve, reject) => {
          this.sqlConnection.all(
            query,
            params,
            (err, result) => {
              if (err) {
                reject(err);
              }
              resolve(result);
            }
          );
        });
      default:
        throw new Error(`Unsupported data source type: ${this.dbType}`);
    }
  }
};

// src/sql/resources/query/JOIN.ts
var joinTemplate = (typeofModel, relatedTable, primaryColumn, foreignColumn) => {
  const table = typeofModel.table;
  const foreignColumnName = foreignColumn.includes(".") ? foreignColumn.split(".").pop() : foreignColumn;
  const primaryColumnName = primaryColumn.includes(".") ? primaryColumn.split(".").pop() : primaryColumn;
  return {
    innerJoin: () => {
      const foreignColumnConverted = convertCase(
        foreignColumnName,
        typeofModel.databaseCaseConvention
      );
      const primaryColumnConverted = convertCase(
        primaryColumnName,
        typeofModel.databaseCaseConvention
      );
      return `
INNER JOIN ${relatedTable} ON ${relatedTable}.${foreignColumnConverted} = ${table}.${primaryColumnConverted} `;
    },
    leftJoin: () => {
      const foreignColumnConverted = convertCase(
        foreignColumnName,
        typeofModel.databaseCaseConvention
      );
      const primaryColumnConverted = convertCase(
        primaryColumnName,
        typeofModel.databaseCaseConvention
      );
      return `
LEFT JOIN ${relatedTable} ON ${relatedTable}.${foreignColumnConverted} = ${table}.${primaryColumnConverted} `;
    }
  };
};
var JOIN_default = joinTemplate;

// src/sql/mysql/mysql_delete_query_builder.ts
var import_luxon2 = require("luxon");

// src/sql/resources/query/WHERE.ts
var whereTemplate = (dbType, typeofModel) => {
  return {
    convertPlaceHolderToValue: (query, startIndex = 1) => {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
          let index = startIndex;
          return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new Error("Unsupported database type");
      }
    },
    where: (column2, value, operator = "=") => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} ${operator} PLACEHOLDER`;
      let params = [value];
      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) ${operator} ?`;
            params = [value];
            break;
          case "postgres":
            query = `
WHERE ${column2}::jsonb ${operator} PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhere: (column2, value, operator = "=") => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} ${operator} PLACEHOLDER`;
      let params = [value];
      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) ${operator} PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column2}::jsonb ${operator} PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhere: (column2, value, operator = "=") => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} ${operator} PLACEHOLDER`;
      let params = [value];
      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) ${operator} PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column2}::jsonb ${operator} PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereNot: (column2, value) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} != PLACEHOLDER`;
      let params = [value];
      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) != PLACEHOLDER`;
            break;
          case "postgres":
            query = `
WHERE ${column2}::jsonb != PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereNot: (column2, value) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} != PLACEHOLDER`;
      let params = [value];
      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) != PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column2}::jsonb != PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereNot: (column2, value) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} != PLACEHOLDER`;
      let params = [value];
      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) != PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column2}::jsonb != PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereBetween: (column2, min, max) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = `
WHERE ${column2}::jsonb BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereBetween: (column2, min, max) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column2}::jsonb BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereBetween: (column2, min, max) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column2}::jsonb BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereNotBetween: (column2, min, max) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = `
WHERE ${column2}::jsonb NOT BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereNotBetween: (column2, min, max) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column2}::jsonb NOT BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereNotBetween: (column2, min, max) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column2}::jsonb NOT BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereIn: (column2, values) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = `
WHERE ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereIn: (column2, values) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = ` AND ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereIn: (column2, values) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = ` OR ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereNotIn: (column2, values) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = `
WHERE ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereNotIn: (column2, values) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = ` AND ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereNotIn: (column2, values) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = ` OR ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereNull: (column2) => ({
      query: `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NULL`,
      params: []
    }),
    andWhereNull: (column2) => ({
      query: ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NULL`,
      params: []
    }),
    orWhereNull: (column2) => ({
      query: ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NULL`,
      params: []
    }),
    whereNotNull: (column2) => ({
      query: `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NOT NULL`,
      params: []
    }),
    andWhereNotNull: (column2) => ({
      query: ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NOT NULL`,
      params: []
    }),
    orWhereNotNull: (column2) => ({
      query: ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NOT NULL`,
      params: []
    }),
    rawWhere: (query) => ({
      query: `
WHERE ${query}`,
      params: []
    }),
    rawAndWhere: (query) => ({
      query: ` AND ${query}`,
      params: []
    }),
    rawOrWhere: (query) => ({
      query: ` OR ${query}`,
      params: []
    })
  };
};
var WHERE_default = whereTemplate;

// src/sql/query_builder/where_query_builder.ts
var WhereQueryBuilder = class {
  /**
   * @description Constructs a query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  constructor(model, table, logs, isNestedCondition = false, sqlDataSource) {
    this.whereQuery = "";
    this.params = [];
    this.isNestedCondition = false;
    this.model = model;
    this.sqlDataSource = sqlDataSource;
    this.logs = logs;
    this.table = table;
    this.whereTemplate = WHERE_default(
      this.sqlDataSource.getDbType(),
      this.model
    );
    this.params = [];
    this.isNestedCondition = isNestedCondition;
  }
  /**
   * @description Accepts a value and executes a callback only of the value exists
   * @param {any} value
   * @param callback
   */
  when(value, cb) {
    if (value === void 0 || value === null) {
      return this;
    }
    cb(value, this);
    return this;
  }
  where(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.whereQuery || this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.where(
      column2,
      actualValue,
      operator
    );
    this.whereQuery = query;
    this.params.push(...params);
    return this;
  }
  andWhere(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhere(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereIn(column2, values) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereIn(column2, values) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereIn(column2, values) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotIn(column2, values) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotIn(column2, values) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNull(column2) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNull(column2) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNull(column2) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotNull(column2) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNotNull(column2) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotNull(column2) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  /**
   * @description Adds a raw WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The query_builder instance for chaining.
   */
  rawWhere(query) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  /**
   * @description Adds a raw AND WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The query_builder instance for chaining.
   */
  rawAndWhere(query) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  /**
   * @description Adds a raw OR WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The query_builder instance for chaining.
   */
  rawOrWhere(query) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
};

// src/sql/query_builder/delete_query_builder.ts
var ModelDeleteQueryBuilder = class extends WhereQueryBuilder {
};

// src/sql/mysql/mysql_delete_query_builder.ts
var MysqlDeleteQueryBuilder = class _MysqlDeleteQueryBuilder extends ModelDeleteQueryBuilder {
  /**
   * @description Constructs a Mysql_query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param mysqlConnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  constructor(model, table, mysql2, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, false, sqlDataSource);
    this.isNestedCondition = false;
    this.sqlConnection = mysql2;
    this.updateTemplate = UPDATE_default(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = DELETE_default(table, sqlDataSource.getDbType());
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
  }
  async softDelete(options) {
    const {
      column: column2 = "deletedAt",
      value = import_luxon2.DateTime.local().toISO(),
      ignoreBeforeDeleteHook = false
    } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    let { query, params } = this.updateTemplate.massiveUpdate(
      [column2],
      [value],
      this.whereQuery,
      this.joinQuery
    );
    params = [...params, ...this.params];
    log(query, this.logs, params);
    try {
      const rows = await this.sqlConnection.query(query, params);
      if (!rows[0].affectedRows) {
        return 0;
      }
      return rows[0].affectedRows;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  async delete(options = {}) {
    const { ignoreBeforeDeleteHook } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery
    );
    log(query, this.logs, this.params);
    try {
      const rows = await this.sqlConnection.query(query, this.params);
      if (!rows[0].affectedRows) {
        return 0;
      }
      return rows[0].affectedRows;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  whereBuilder(cb) {
    const queryBuilder = new _MysqlDeleteQueryBuilder(
      this.model,
      this.model.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  /**
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  orWhereBuilder(cb) {
    const nestedBuilder = new _MysqlDeleteQueryBuilder(
      this.model,
      this.model.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  /**
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  andWhereBuilder(cb) {
    const nestedBuilder = new _MysqlDeleteQueryBuilder(
      this.model,
      this.model.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
};

// src/sql/pagination.ts
function getPaginationMetadata(page, limit, total) {
  return {
    total,
    perPage: limit,
    currentPage: page,
    firstPage: 1,
    isEmpty: total === 0,
    lastPage: Math.max(1, Math.ceil(total / limit)),
    hasMorePages: page < Math.max(1, Math.ceil(total / limit)),
    hasPages: total > limit
  };
}

// src/sql/resources/query/SELECT.ts
var commonSelectMethods = [
  "*",
  "COUNT",
  "DISTINCT",
  "CONCAT",
  "GROUP_CONCAT",
  "AVG",
  "MAX",
  "MIN",
  "SUM",
  "AS",
  "CONVERT",
  "CAST",
  "CONVERT_TZ",
  "DATE_FORMAT",
  "CURDATE",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "CURRENT_TIMESTAMP",
  "CURTIME",
  "DAYNAME",
  "DAYOFMONTH",
  "DAYOFWEEK",
  "DAYOFYEAR",
  "EXTRACT",
  "HOUR",
  "LOCALTIME",
  "LOCALTIMESTAMP",
  "MICROSECOND",
  "MINUTE",
  "MONTH",
  "QUARTER",
  "SECOND",
  "STR_TO_DATE",
  "TIME",
  "TIMESTAMP",
  "WEEK",
  "YEAR",
  "NOW",
  "UTC_DATE",
  "UTC_TIME",
  "UTC_TIMESTAMP",
  "DATE_ADD",
  "DATE_SUB",
  "DATE",
  "DATEDIFF",
  "DATE_FORMAT",
  "DISTINCTROW"
];
var selectTemplate = (dbType, typeofModel) => {
  const table = typeofModel.table;
  const escapeIdentifier = (identifier) => {
    switch (dbType) {
      case "mysql":
      case "sqlite":
      case "mariadb":
        return `\`${identifier.replace(/`/g, "``")}\``;
      case "postgres":
        return `"${identifier.replace(/"/g, '""')}"`;
      default:
        throw new Error("Unsupported database type");
    }
  };
  return {
    selectAll: `SELECT * FROM ${table} `,
    selectById: (id) => `SELECT * FROM ${table} WHERE id = ${id}`,
    selectByIds: (ids) => {
      ids = ids.map((id) => escapeIdentifier(id));
      return `SELECT * FROM ${table} WHERE id IN (${ids.join(", ")})`;
    },
    selectColumns: (...columns) => {
      columns = columns.map((column2) => {
        const columnCase = typeofModel.databaseCaseConvention;
        let tableName = "";
        let columnName = column2;
        let alias = "";
        if (column2.toUpperCase().includes(" AS ")) {
          [columnName, alias] = column2.split(/ AS /i);
        }
        alias = convertCase(alias, columnCase);
        if (columnName.includes(".")) {
          [tableName, columnName] = columnName.split(".");
        }
        if (commonSelectMethods.includes(columnName.toUpperCase()) || columnName.includes("(")) {
          return alias ? `${columnName} AS ${alias}` : columnName;
        }
        let finalColumn = columnName;
        if (!alias) {
          const processedColumnName = escapeIdentifier(
            convertCase(columnName, columnCase)
          );
          finalColumn = tableName ? `${tableName}.${processedColumnName}` : processedColumnName;
        } else if (tableName) {
          finalColumn = `${tableName}.${columnName}`;
        }
        return alias ? `${finalColumn} AS ${alias}` : finalColumn;
      });
      return `SELECT ${columns.join(", ")} FROM ${table} `;
    },
    selectCount: `SELECT COUNT(*) FROM ${table} `,
    selectDistinct: (...columns) => {
      columns = columns.map(
        (column2) => escapeIdentifier(
          convertCase(column2, typeofModel.databaseCaseConvention)
        )
      );
      return `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `;
    },
    selectSum: (column2) => `SELECT SUM(${escapeIdentifier(
      convertCase(column2, typeofModel.databaseCaseConvention)
    )}) FROM ${table} `,
    orderBy: (columns, order = "ASC") => {
      columns = columns.map((column2) => {
        let tableName = "";
        let columnName = column2;
        if (column2.includes(".")) {
          [tableName, columnName] = column2.split(".");
        }
        const processedColumnName = convertCase(
          columnName,
          typeofModel.databaseCaseConvention
        );
        return tableName ? `${tableName}.${processedColumnName}` : processedColumnName;
      });
      return ` ORDER BY ${columns.join(", ")} ${order}`;
    },
    groupBy: (...columns) => {
      columns = columns.map((column2) => {
        let tableName = "";
        let columnName = column2;
        if (column2.includes(".")) {
          [tableName, columnName] = column2.split(".");
        }
        const processedColumnName = convertCase(
          columnName,
          typeofModel.databaseCaseConvention
        );
        return tableName ? `${tableName}.${processedColumnName}` : processedColumnName;
      });
      return ` GROUP BY ${columns.join(", ")}`;
    },
    limit: (limit) => {
      return ` LIMIT ${limit}`;
    },
    offset: (offset) => {
      return ` OFFSET ${offset}`;
    }
  };
};
var SELECT_default = selectTemplate;

// src/sql/query_builder/query_builder.ts
var QueryBuilder = class extends WhereQueryBuilder {
  /**
   * @description Constructs a Mysql_query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param logs - A boolean indicating whether to log queries.
   */
  constructor(model, table, logs, sqlDataSource) {
    super(model, table, logs, false, sqlDataSource);
    this.sqlDataSource = sqlDataSource;
    this.selectQuery = SELECT_default(
      this.sqlDataSource.getDbType(),
      this.model
    ).selectAll;
    this.selectTemplate = SELECT_default(
      this.sqlDataSource.getDbType(),
      this.model
    );
    this.joinQuery = "";
    this.relations = [];
    this.dynamicColumns = [];
    this.whereQuery = "";
    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
  }
  groupFooterQuery() {
    return this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
  }
  async mergeRawPacketIntoModel(model, row, typeofModel) {
    const columns = getModelColumns(this.model);
    Object.entries(row).forEach(([key, value]) => {
      const casedKey = convertCase(
        key,
        typeofModel.modelCaseConvention
      );
      if (columns.includes(casedKey)) {
        Object.assign(model, { [casedKey]: value });
        return;
      }
      model.extraColumns[key] = value;
    });
    if (!this.dynamicColumns.length) {
      return;
    }
    await addDynamicColumnsToModel(this.model, model, this.dynamicColumns);
  }
};

// src/sql/mysql/mysql_query_builder.ts
var MysqlQueryBuilder = class _MysqlQueryBuilder extends QueryBuilder {
  /**
   * @param table - The name of the table.
   * @param mysqlConnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  constructor(model, table, mysqlConnection, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, sqlDataSource);
    this.isNestedCondition = false;
    this.mysqlConnection = mysqlConnection;
    this.isNestedCondition = isNestedCondition;
    this.mysqlModelManagerUtils = new SqlModelManagerUtils(
      "mysql",
      this.mysqlConnection
    );
  }
  async one(options = { throwErrorOnNull: false }) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    this.limit(1);
    query += this.groupFooterQuery();
    query = query.trim();
    log(query, this.logs, this.params);
    try {
      const [rows] = await this.mysqlConnection.query(
        query,
        this.params
      );
      if (!rows.length) {
        if (options.throwErrorOnNull) {
          throw new Error("ROW_NOT_FOUND");
        }
        return null;
      }
      const modelInstance = getBaseModelInstance();
      await this.mergeRawPacketIntoModel(modelInstance, rows[0], this.model);
      const relationModels = await this.mysqlModelManagerUtils.parseQueryBuilderRelations(
        [modelInstance],
        this.model,
        this.relations,
        this.logs
      );
      const model = await parseDatabaseDataIntoModelResponse(
        [modelInstance],
        this.model,
        relationModels
      );
      return !options.ignoreHooks?.includes("afterFetch") ? (await this.model.afterFetch([model]))[0] : model;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  async oneOrFail(options) {
    const model = await this.one({
      throwErrorOnNull: true,
      ignoreHooks: options?.ignoreHooks
    });
    return model;
  }
  async many(options = {}) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query += this.groupFooterQuery();
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    query = query.trim();
    log(query, this.logs, this.params);
    try {
      const [rows] = await this.mysqlConnection.query(
        query,
        this.params
      );
      const modelPromises = rows.map(async (row) => {
        const modelInstance = getBaseModelInstance();
        await this.mergeRawPacketIntoModel(modelInstance, row, this.model);
        return modelInstance;
      });
      const models = await Promise.all(modelPromises);
      const relationModels = await this.mysqlModelManagerUtils.parseQueryBuilderRelations(
        models,
        this.model,
        this.relations,
        this.logs
      );
      const serializedModels = await parseDatabaseDataIntoModelResponse(
        models,
        this.model,
        relationModels
      );
      if (!serializedModels) {
        return [];
      }
      if (!options.ignoreHooks?.includes("afterFetch")) {
        await this.model.afterFetch(serializedModels);
      }
      return Array.isArray(serializedModels) ? serializedModels : [serializedModels];
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  async getCount(options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const [result2] = await this.mysqlConnection.query(
        `SELECT COUNT(*) as total from ${this.table}`
      );
      return result2[0].total;
    }
    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.extraColumns.total : 0;
  }
  async getSum(column2, options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const [result2] = await this.mysqlConnection.query(
        `SELECT SUM(${column2}) as total from ${this.table}`
      );
      return result2[0].total;
    }
    column2 = convertCase(column2, this.model.databaseCaseConvention);
    this.select(`SUM(${column2}) as total`);
    const result = await this.one();
    return result ? +result.extraColumns.total : 0;
  }
  async paginate(page, limit, options) {
    this.limitQuery = this.selectTemplate.limit(limit);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * limit);
    const originalSelectQuery = this.selectQuery;
    this.select("COUNT(*) as total");
    const total = await this.many(options);
    this.selectQuery = originalSelectQuery;
    const models = await this.many(options);
    const paginationMetadata = getPaginationMetadata(
      page,
      limit,
      +total[0].extraColumns["total"]
    );
    let data = await parseDatabaseDataIntoModelResponse(models, this.model) || [];
    if (Array.isArray(data)) {
      data = data.filter((model) => model !== null);
    }
    return {
      paginationMetadata,
      data: Array.isArray(data) ? data : [data]
    };
  }
  select(...columns) {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...columns
    );
    return this;
  }
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.leftJoin();
    return this;
  }
  addRelations(relations) {
    this.relations = relations;
    return this;
  }
  addDynamicColumns(dynamicColumns) {
    this.dynamicColumns = dynamicColumns;
    return this;
  }
  whereBuilder(cb) {
    const queryBuilder = new _MysqlQueryBuilder(
      this.model,
      this.table,
      this.mysqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  orWhereBuilder(cb) {
    const nestedBuilder = new _MysqlQueryBuilder(
      this.model,
      this.table,
      this.mysqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  andWhereBuilder(cb) {
    const nestedBuilder = new _MysqlQueryBuilder(
      this.model,
      this.table,
      this.mysqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  when(value, cb) {
    if (value === void 0 || value === null) {
      return this;
    }
    cb(value, this);
    return this;
  }
  where(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhere(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhere(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNotIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNotNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNotNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  rawWhere(query) {
    if (this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(query);
      this.whereQuery += rawQuery2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  rawAndWhere(query) {
    if (this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawAndWhere(query);
      this.whereQuery += rawQuery2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawAndWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  rawOrWhere(query) {
    if (this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawOrWhere(query);
      this.whereQuery += rawQuery2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawOrWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  groupByRaw(query) {
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }
  orderBy(columns, order) {
    this.orderByQuery = this.selectTemplate.orderBy(columns, order);
    return this;
  }
  orderByRaw(query) {
    this.orderByQuery = ` ORDER BY ${query}`;
    return this;
  }
  limit(limit) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }
  offset(offset) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }
  copy() {
    const queryBuilder = new _MysqlQueryBuilder(
      this.model,
      this.table,
      this.mysqlConnection,
      this.logs,
      this.isNestedCondition,
      this.sqlDataSource
    );
    queryBuilder.selectQuery = this.selectQuery;
    queryBuilder.whereQuery = this.whereQuery;
    queryBuilder.joinQuery = this.joinQuery;
    queryBuilder.groupByQuery = this.groupByQuery;
    queryBuilder.orderByQuery = this.orderByQuery;
    queryBuilder.limitQuery = this.limitQuery;
    queryBuilder.offsetQuery = this.offsetQuery;
    queryBuilder.params = [...this.params];
    queryBuilder.relations = [...this.relations];
    return queryBuilder;
  }
  groupFooterQuery() {
    return this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
  }
};

// src/sql/query_builder/update_query_builder.ts
var ModelUpdateQueryBuilder = class extends WhereQueryBuilder {
};

// src/sql/mysql/mysql_update_query_builder.ts
var MysqlUpdateQueryBuilder = class _MysqlUpdateQueryBuilder extends ModelUpdateQueryBuilder {
  /**
   * @description Constructs a Mysql_query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param mysqlConnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  constructor(model, table, mysqlConnection, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, false, sqlDataSource);
    this.joinQuery = "";
    this.isNestedCondition = false;
    this.sqlConnection = mysqlConnection;
    this.updateTemplate = UPDATE_default(
      this.sqlDataSource.getDbType(),
      this.model
    );
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
  }
  async withData(data, options) {
    const { ignoreBeforeUpdateHook } = options || {};
    if (!ignoreBeforeUpdateHook) {
      this.model.beforeUpdate(this);
    }
    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery
    );
    const { query, params } = this.updateTemplate.massiveUpdate(
      columns,
      values,
      this.whereQuery,
      this.joinQuery
    );
    params.push(...this.params);
    log(query, this.logs, params);
    try {
      const rows = await this.sqlConnection.query(query, params);
      if (!rows[0].affectedRows) {
        return 0;
      }
      return rows[0].affectedRows;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  whereBuilder(cb) {
    const queryBuilder = new _MysqlUpdateQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  /**
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  orWhereBuilder(cb) {
    const nestedBuilder = new _MysqlUpdateQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  /**
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  andWhereBuilder(cb) {
    const nestedBuilder = new _MysqlUpdateQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
};

// src/sql/mysql/mysql_model_manager.ts
var MysqlModelManager = class extends ModelManager {
  /**
   * Constructor for MysqlModelManager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Connection} mysqlConnection - MySQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model, mysqlConnection, logs, sqlDataSource) {
    super(model, logs, sqlDataSource);
    this.mysqlConnection = mysqlConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils(
      "mysql",
      mysqlConnection
    );
  }
  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  async find(input) {
    try {
      if (!input) {
        return await this.query().many();
      }
      const query = this.query();
      if (input.select) {
        query.select(...input.select);
      }
      if (input.relations) {
        query.addRelations(input.relations);
      }
      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }
      if (input.orderBy) {
        query.orderBy(input.orderBy.columns, input.orderBy.type);
      }
      if (input.limit) {
        query.limit(input.limit);
      }
      if (input.offset) {
        query.offset(input.offset);
      }
      if (input.groupBy) {
        query.groupBy(...input.groupBy);
      }
      return await query.many({ ignoreHooks: input.ignoreHooks || [] });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    try {
      const query = this.query();
      if (input.select) {
        query.select(...input.select);
      }
      if (input.relations) {
        query.addRelations(input.relations);
      }
      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }
      return await query.one({
        throwErrorOnNull: input.throwErrorOnNull || false,
        ignoreHooks: input.ignoreHooks || []
      });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneByPrimaryKey(value, throwErrorOnNull = false) {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " + this.model.table + " has no primary key to be retrieved by"
        );
      }
      return await this.query().where(this.model.primaryKey, value).one({
        throwErrorOnNull
      });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {TransactionType} trx - TransactionType to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  async insert(model) {
    this.model.beforeInsert(model);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    try {
      log(query, this.logs, params);
      const [result] = await this.mysqlConnection.query(
        query,
        params
      );
      if (this.model.primaryKey && model[this.model.primaryKey]) {
        const pkValue = model[this.model.primaryKey];
        return await this.findOneByPrimaryKey(pkValue);
      }
      return await this.findOneByPrimaryKey(result["insertId"]);
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {TransactionType} trx - TransactionType to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  async insertMany(models) {
    models.forEach((model) => {
      this.model.beforeInsert(model);
    });
    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models,
      this.model,
      this.sqlDataSource.getDbType()
    );
    try {
      log(query, this.logs, params);
      const [rows] = await this.mysqlConnection.query(query, params);
      if (!rows.affectedRows) {
        return [];
      }
      if (this.model.primaryKey && models[0][this.model.primaryKey]) {
        const idsToFetchList2 = models.map(
          (model) => model[this.model.primaryKey]
        );
        const primaryKeyList = idsToFetchList2.map((key) => `'${key}'`).join(",");
        return await this.query().whereIn(this.model.primaryKey, idsToFetchList2).orderByRaw(`FIELD(${this.model.primaryKey}, ${primaryKeyList})`).many();
      }
      const idsToFetchList = Array.from(
        { length: rows.affectedRows },
        (_, i) => i + rows.insertId
      );
      return await this.query().whereIn(this.model.primaryKey, idsToFetchList).many();
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {TransactionType} trx - TransactionType to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async updateRecord(model) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be updated, try save"
      );
    }
    try {
      const updateQuery = this.sqlModelManagerUtils.parseUpdate(
        model,
        this.model,
        this.sqlDataSource.getDbType()
      );
      log(updateQuery.query, this.logs, updateQuery.params);
      await this.mysqlConnection.query(updateQuery.query, updateQuery.params);
      if (!this.model.primaryKey) {
        log(
          "Model has no primary key so no record can be retrieved",
          this.logs
        );
        return null;
      }
      return await this.findOneByPrimaryKey(
        model[this.model.primaryKey]
      );
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {TransactionType} trx - TransactionType to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteRecord(model) {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " + this.model.table + " has no primary key to be deleted from"
        );
      }
      const { query, params } = this.sqlModelManagerUtils.parseDelete(
        this.model.table,
        this.model.primaryKey,
        model[this.model.primaryKey]
      );
      log(query, this.logs, params);
      const [rows] = await this.mysqlConnection.query(
        query,
        params
      );
      if (this.sqlDataSource.getDbType() === "mariadb") {
        return await parseDatabaseDataIntoModelResponse(
          [rows[0]],
          this.model
        );
      }
      return model;
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   *
   * @returns {Mysql_query_builder<Model>} - Instance of Mysql_query_builder.
   */
  query() {
    return new MysqlQueryBuilder(
      this.model,
      this.model.table,
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
  /**
   * @description Returns an update query builder.
   */
  update() {
    return new MysqlUpdateQueryBuilder(
      this.model,
      this.model.table,
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
  /**
   * @description Returns a delete query builder.
   */
  deleteQuery() {
    return new MysqlDeleteQueryBuilder(
      this.model,
      this.model.table,
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
};

// src/sql/postgres/postgres_query_builder.ts
var import_reflect_metadata = require("reflect-metadata");
var PostgresQueryBuilder = class _PostgresQueryBuilder extends QueryBuilder {
  constructor(model, table, pgClient, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, sqlDataSource);
    this.pgClient = pgClient;
    this.isNestedCondition = isNestedCondition;
    this.postgresModelManagerUtils = new SqlModelManagerUtils(
      "postgres",
      this.pgClient
    );
  }
  select(...columns) {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...columns
    );
    return this;
  }
  async one(options = { throwErrorOnNull: false }) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    this.limitQuery = this.selectTemplate.limit(1);
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    this.limit(1);
    query += this.groupFooterQuery();
    query = query.trim();
    log(query, this.logs, this.params);
    try {
      const result = await this.pgClient.query(query, this.params);
      if (!result.rows[0]) {
        if (options.throwErrorOnNull) {
          throw new Error("ROW_NOT_FOUND");
        }
        return null;
      }
      const modelInstance = getBaseModelInstance();
      await this.mergeRawPacketIntoModel(
        modelInstance,
        result.rows[0],
        this.model
      );
      const relationModels = await this.postgresModelManagerUtils.parseQueryBuilderRelations(
        [modelInstance],
        this.model,
        this.relations,
        this.logs
      );
      const model = await parseDatabaseDataIntoModelResponse(
        [modelInstance],
        this.model,
        relationModels
      );
      return !options.ignoreHooks?.includes("afterFetch") ? (await this.model.afterFetch([model]))[0] : model;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  async oneOrFail(options) {
    const model = await this.one({
      throwErrorOnNull: true,
      ignoreHooks: options?.ignoreHooks
    });
    return model;
  }
  async many(options = {}) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query += this.groupFooterQuery();
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    query = query.trim();
    log(query, this.logs, this.params);
    try {
      const result = await this.pgClient.query(query, this.params);
      const rows = result.rows;
      const modelPromises = rows.map(async (row) => {
        const modelInstance = getBaseModelInstance();
        await this.mergeRawPacketIntoModel(modelInstance, row, this.model);
        return modelInstance;
      });
      const models = await Promise.all(modelPromises);
      const relationModels = await this.postgresModelManagerUtils.parseQueryBuilderRelations(
        models,
        this.model,
        this.relations,
        this.logs
      );
      const serializedModels = await parseDatabaseDataIntoModelResponse(
        models,
        this.model,
        relationModels
      );
      if (!serializedModels) {
        return [];
      }
      if (!options.ignoreHooks?.includes("afterFetch")) {
        await this.model.afterFetch(serializedModels);
      }
      return Array.isArray(serializedModels) ? serializedModels : [serializedModels];
    } catch (error) {
      throw new Error("query failed: " + error.message);
    }
  }
  async getCount(options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const { rows } = await this.pgClient.query(
        `SELECT COUNT(*) as total from ${this.table}`
      );
      return +rows[0].total;
    }
    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.extraColumns["total"] : 0;
  }
  async getSum(column2, options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const { rows } = await this.pgClient.query(
        `SELECT SUM(${column2}) as total from ${this.table}`
      );
      return +rows[0].total || 0;
    }
    column2 = convertCase(column2, this.model.databaseCaseConvention);
    this.select(`SUM(${column2}) as total`);
    const result = await this.one();
    return result ? +result.extraColumns["total"] : 0;
  }
  async paginate(page, limit, options) {
    this.limitQuery = this.selectTemplate.limit(limit);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * limit);
    const originalSelectQuery = this.selectQuery;
    this.select("COUNT(*) as total");
    const total = await this.many(options);
    this.selectQuery = originalSelectQuery;
    const models = await this.many(options);
    const paginationMetadata = getPaginationMetadata(
      page,
      limit,
      +total[0].extraColumns["total"]
    );
    let data = await parseDatabaseDataIntoModelResponse(models, this.model) || [];
    if (Array.isArray(data)) {
      data = data.filter((model) => model !== null);
    }
    return {
      paginationMetadata,
      data: Array.isArray(data) ? data : [data]
    };
  }
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.leftJoin();
    return this;
  }
  addRelations(relations) {
    this.relations = relations;
    return this;
  }
  addDynamicColumns(dynamicColumns) {
    this.dynamicColumns = dynamicColumns;
    return this;
  }
  whereBuilder(cb) {
    const queryBuilder = new _PostgresQueryBuilder(
      this.model,
      this.table,
      this.pgClient,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  orWhereBuilder(cb) {
    const nestedBuilder = new _PostgresQueryBuilder(
      this.model,
      this.table,
      this.pgClient,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  andWhereBuilder(cb) {
    const nestedBuilder = new _PostgresQueryBuilder(
      this.model,
      this.table,
      this.pgClient,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  when(value, cb) {
    if (value === void 0 || value === null) {
      return this;
    }
    cb(value, this);
    return this;
  }
  where(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhere(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhere(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNotIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNotNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNotNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  rawWhere(query) {
    if (this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(query);
      this.whereQuery += rawQuery2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  rawAndWhere(query) {
    if (this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawAndWhere(query);
      this.whereQuery += rawQuery2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawAndWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  rawOrWhere(query) {
    if (this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawOrWhere(query);
      this.whereQuery += rawQuery2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawOrWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  groupByRaw(query) {
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }
  orderBy(columns, order) {
    this.orderByQuery = this.selectTemplate.orderBy(columns, order);
    return this;
  }
  orderByRaw(query) {
    this.orderByQuery = ` ORDER BY ${query}`;
    return this;
  }
  limit(limit) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }
  offset(offset) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }
  copy() {
    const queryBuilder = new _PostgresQueryBuilder(
      this.model,
      this.table,
      this.pgClient,
      this.logs,
      this.isNestedCondition,
      this.sqlDataSource
    );
    queryBuilder.selectQuery = this.selectQuery;
    queryBuilder.whereQuery = this.whereQuery;
    queryBuilder.groupByQuery = this.groupByQuery;
    queryBuilder.orderByQuery = this.orderByQuery;
    queryBuilder.limitQuery = this.limitQuery;
    queryBuilder.offsetQuery = this.offsetQuery;
    queryBuilder.params = [...this.params];
    return queryBuilder;
  }
  groupFooterQuery() {
    return this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
  }
};

// src/sql/postgres/postgres_update_query_builder.ts
var PostgresUpdateQueryBuilder = class _PostgresUpdateQueryBuilder extends ModelUpdateQueryBuilder {
  /**
   * @description Constructs a Mysql_query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param pgClient - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  constructor(model, table, pgClient, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, false, sqlDataSource);
    this.joinQuery = "";
    this.isNestedCondition = false;
    this.sqlConnection = pgClient;
    this.updateTemplate = UPDATE_default(
      this.sqlDataSource.getDbType(),
      this.model
    );
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
  }
  async withData(data, options) {
    const { ignoreBeforeUpdateHook } = options || {};
    if (!ignoreBeforeUpdateHook) {
      this.model.beforeUpdate(this);
    }
    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
      values.length + 1
    );
    const { query, params } = this.updateTemplate.massiveUpdate(
      columns,
      values,
      this.whereQuery,
      this.joinQuery
    );
    params.push(...this.params);
    log(query, this.logs, params);
    try {
      const result = await this.sqlConnection.query(query, params);
      if (!result.rows) {
        return 0;
      }
      return result.rowCount || 0;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  whereBuilder(cb) {
    const queryBuilder = new _PostgresUpdateQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  /**
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  orWhereBuilder(cb) {
    const nestedBuilder = new _PostgresUpdateQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  /**
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  andWhereBuilder(cb) {
    const nestedBuilder = new _PostgresUpdateQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
};

// src/sql/postgres/postgres_delete_query_builder.ts
var import_luxon3 = require("luxon");
var PostgresDeleteQueryBuilder = class _PostgresDeleteQueryBuilder extends ModelDeleteQueryBuilder {
  /**
   * @description Constructs a Mysql_query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param pgClient - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  constructor(model, table, pgClient, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, false, sqlDataSource);
    this.isNestedCondition = false;
    this.sqlConnection = pgClient;
    this.updateTemplate = UPDATE_default(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = DELETE_default(table, sqlDataSource.getDbType());
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
  }
  async delete(options = {}) {
    const { ignoreBeforeDeleteHook } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery
    );
    log(query, this.logs, this.params);
    try {
      const result = await this.sqlConnection.query(query, this.params);
      if (!result.rows) {
        return 0;
      }
      return result.rowCount || 0;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  async softDelete(options) {
    const {
      column: column2 = "deletedAt",
      value = import_luxon3.DateTime.local().toISO(),
      ignoreBeforeDeleteHook = false
    } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    let { query, params } = this.updateTemplate.massiveUpdate(
      [column2],
      [value],
      this.whereQuery,
      this.joinQuery
    );
    params = [...params, ...this.params];
    log(query, this.logs, params);
    try {
      const result = await this.sqlConnection.query(query, params);
      if (!result.rows) {
        return 0;
      }
      return result.rowCount || 0;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  whereBuilder(cb) {
    const queryBuilder = new _PostgresDeleteQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  /**
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  orWhereBuilder(cb) {
    const nestedBuilder = new _PostgresDeleteQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  /**
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  andWhereBuilder(cb) {
    const nestedBuilder = new _PostgresDeleteQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
};

// src/sql/postgres/postgres_model_manager.ts
var PostgresModelManager = class extends ModelManager {
  /**
   * Constructor for Postgres_model_manager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Pool} pgConnection - PostgreSQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model, pgConnection, logs, sqlDataSource) {
    super(model, logs, sqlDataSource);
    this.pgConnection = pgConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils(
      "postgres",
      pgConnection
    );
  }
  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  async find(input) {
    try {
      if (!input) {
        return await this.query().many();
      }
      const query = this.query();
      if (input.select) {
        query.select(...input.select);
      }
      if (input.relations) {
        query.addRelations(input.relations);
      }
      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }
      if (input.orderBy) {
        query.orderBy(input.orderBy.columns, input.orderBy.type);
      }
      if (input.limit) {
        query.limit(input.limit);
      }
      if (input.offset) {
        query.offset(input.offset);
      }
      if (input.groupBy) {
        query.groupBy(...input.groupBy);
      }
      return await query.many({ ignoreHooks: input.ignoreHooks || [] });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    try {
      const query = this.query();
      if (input.select) {
        query.select(...input.select);
      }
      if (input.relations) {
        query.addRelations(input.relations);
      }
      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }
      return await query.one({
        throwErrorOnNull: input.throwErrorOnNull || false,
        ignoreHooks: input.ignoreHooks || []
      });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK value of the record to retrieve.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneByPrimaryKey(value, throwErrorOnNull = false) {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " + this.model.table + " has no primary key to be retrieved by"
        );
      }
      return await this.query().where(this.model.primaryKey, "=", value).one({ throwErrorOnNull });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  async insert(model) {
    this.model.beforeInsert(model);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    try {
      const { query: query2, params: params2 } = this.sqlModelManagerUtils.parseInsert(
        model,
        this.model,
        this.sqlDataSource.getDbType()
      );
      log(query2, this.logs, params2);
      const { rows } = await this.pgConnection.query(query2, params2);
      const insertedModel = rows[0];
      if (!insertedModel) {
        throw new Error(rows[0]);
      }
      return await parseDatabaseDataIntoModelResponse(
        [insertedModel],
        this.model
      );
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} models - Model instance to be saved.
   * @param {Transaction} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  async insertMany(models) {
    models.forEach((model) => this.model.beforeInsert(model));
    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models,
      this.model,
      this.sqlDataSource.getDbType()
    );
    try {
      const { query: query2, params: params2 } = this.sqlModelManagerUtils.parseMassiveInsert(
        models,
        this.model,
        this.sqlDataSource.getDbType()
      );
      log(query2, this.logs, params2);
      const { rows } = await this.pgConnection.query(query2, params2);
      const insertedModel = rows;
      if (!insertedModel.length) {
        return [];
      }
      const insertModelPromise = insertedModel.map(
        async (model) => await parseDatabaseDataIntoModelResponse([model], this.model)
      );
      return await Promise.all(insertModelPromise);
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {Transaction} trx - Transaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async updateRecord(model) {
    const { table, primaryKey } = this.model;
    if (!primaryKey) {
      throw new Error(
        "Model " + table + " has no primary key to be updated, try save"
      );
    }
    const { query, params } = this.sqlModelManagerUtils.parseUpdate(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    try {
      const { query: query2, params: params2 } = this.sqlModelManagerUtils.parseUpdate(
        model,
        this.model,
        this.sqlDataSource.getDbType()
      );
      log(query2, this.logs, params2);
      await this.pgConnection.query(query2, params2);
      if (!primaryKey) {
        return null;
      }
      return await this.findOneByPrimaryKey(
        model[primaryKey]
      );
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {Transaction} trx - Transaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteRecord(model) {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " + this.model.table + " has no primary key to be deleted from"
        );
      }
      const { query, params } = this.sqlModelManagerUtils.parseDelete(
        this.model.table,
        this.model.primaryKey,
        model[this.model.primaryKey]
      );
      log(query, this.logs, params);
      await this.pgConnection.query(query, params);
      return model;
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of Mysql_query_builder.
   */
  query() {
    return new PostgresQueryBuilder(
      this.model,
      this.model.table,
      this.pgConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
  /**
   * @description Returns an update query builder.
   */
  update() {
    return new PostgresUpdateQueryBuilder(
      this.model,
      this.model.table,
      this.pgConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
  /**
   * @description Returns a delete query builder.
   */
  deleteQuery() {
    return new PostgresDeleteQueryBuilder(
      this.model,
      this.model.table,
      this.pgConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
};

// src/sql/sqlite/sql_lite_query_builder.ts
var SqlLiteQueryBuilder = class _SqlLiteQueryBuilder extends QueryBuilder {
  /**
   * @param table - The name of the table.
   * @param sqLiteConnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  constructor(model, table, sqLiteConnection, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, sqlDataSource);
    this.isNestedCondition = false;
    this.sqLiteConnection = sqLiteConnection;
    this.isNestedCondition = isNestedCondition;
    this.sqliteModelManagerUtils = new SqlModelManagerUtils(
      "sqlite",
      this.sqLiteConnection
    );
  }
  async one(options = { throwErrorOnNull: false }) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    this.limit(1);
    query += this.groupFooterQuery();
    query = query.trim();
    log(query, this.logs, this.params);
    try {
      const results = await this.promisifyQuery(query, this.params);
      if (!results.length) {
        return null;
      }
      const result = results[0];
      if (options.throwErrorOnNull && !result) {
        throw new Error("ERR_NOT_FOUND");
      }
      const modelInstance = getBaseModelInstance();
      await this.mergeRawPacketIntoModel(modelInstance, result, this.model);
      const relationModels = await this.sqliteModelManagerUtils.parseQueryBuilderRelations(
        [modelInstance],
        this.model,
        this.relations,
        this.logs
      );
      const model = await parseDatabaseDataIntoModelResponse(
        [modelInstance],
        this.model,
        relationModels
      );
      return !options.ignoreHooks?.includes("afterFetch") ? (await this.model.afterFetch([model]))[0] : model;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  async oneOrFail(options) {
    const model = await this.one({
      throwErrorOnNull: true,
      ignoreHooks: options?.ignoreHooks
    });
    return model;
  }
  async many(options = {}) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query += this.groupFooterQuery();
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    query = query.trim();
    log(query, this.logs, this.params);
    try {
      const results = await this.promisifyQuery(query, this.params);
      const modelPromises = results.map(async (result) => {
        const modelInstance = getBaseModelInstance();
        await this.mergeRawPacketIntoModel(modelInstance, result, this.model);
        return modelInstance;
      });
      const models = await Promise.all(modelPromises);
      const relationModels = await this.sqliteModelManagerUtils.parseQueryBuilderRelations(
        models,
        this.model,
        this.relations,
        this.logs
      );
      const serializedModels = await parseDatabaseDataIntoModelResponse(
        models,
        this.model,
        relationModels
      );
      if (!serializedModels) {
        return [];
      }
      if (!options.ignoreHooks?.includes("afterFetch")) {
        await this.model.afterFetch(serializedModels);
      }
      return Array.isArray(serializedModels) ? serializedModels : [serializedModels];
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  async raw(query, params = []) {
    return await this.promisifyQuery(query, params);
  }
  async getCount(options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const result2 = await this.promisifyQuery(
        "SELECT COUNT(*) as total FROM " + this.table,
        []
      );
      return +result2[0].total;
    }
    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.extraColumns.total : 0;
  }
  async getSum(column2, options = { ignoreHooks: false }) {
    if (!options.ignoreHooks) {
      const result2 = await this.promisifyQuery(
        `SELECT SUM("${column2}) as total FROM ` + this.table,
        []
      );
      return +result2[0].total || 0;
    }
    column2 = convertCase(column2, this.model.databaseCaseConvention);
    this.select(`SUM(${column2}) as total`);
    const result = await this.one();
    return result ? +result.extraColumns.total : 0;
  }
  async paginate(page, limit, options) {
    this.limitQuery = this.selectTemplate.limit(limit);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * limit);
    const originalSelectQuery = this.selectQuery;
    this.select("COUNT(*) as total");
    const total = await this.many(options);
    this.selectQuery = originalSelectQuery;
    const models = await this.many(options);
    const paginationMetadata = getPaginationMetadata(
      page,
      limit,
      +total[0].extraColumns["total"]
    );
    let data = await parseDatabaseDataIntoModelResponse(models, this.model) || [];
    if (Array.isArray(data)) {
      data = data.filter((model) => model !== null);
    }
    return {
      paginationMetadata,
      data: Array.isArray(data) ? data : [data]
    };
  }
  select(...columns) {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...columns
    );
    return this;
  }
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.leftJoin();
    return this;
  }
  addRelations(relations) {
    this.relations = relations;
    return this;
  }
  addDynamicColumns(dynamicColumns) {
    this.dynamicColumns = dynamicColumns;
    return this;
  }
  whereBuilder(cb) {
    const queryBuilder = new _SqlLiteQueryBuilder(
      this.model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  orWhereBuilder(cb) {
    const nestedBuilder = new _SqlLiteQueryBuilder(
      this.model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  andWhereBuilder(cb) {
    const nestedBuilder = new _SqlLiteQueryBuilder(
      this.model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  when(value, cb) {
    if (value === void 0 || value === null) {
      return this;
    }
    cb(value, this);
    return this;
  }
  where(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhere(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhere(column2, operatorOrValue, value) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue;
      actualValue = value;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotBetween(column2, min, max) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotIn(column2, values) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNotIn(
        column2,
        values
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNotNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhereNotNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotNull(column2) {
    if (this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.orWhereNotNull(
        column2
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  rawWhere(query) {
    if (this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(query);
      this.whereQuery += rawQuery2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  rawAndWhere(query) {
    if (this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawAndWhere(query);
      this.whereQuery += rawQuery2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawAndWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  rawOrWhere(query) {
    if (this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawOrWhere(query);
      this.whereQuery += rawQuery2;
      this.params.push(...params2);
      return this;
    }
    if (!this.whereQuery) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawOrWhere(query);
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  groupByRaw(query) {
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }
  orderBy(columns, order) {
    this.orderByQuery = this.selectTemplate.orderBy(columns, order);
    return this;
  }
  orderByRaw(query) {
    this.orderByQuery = ` ORDER BY ${query}`;
    return this;
  }
  limit(limit) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }
  offset(offset) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }
  copy() {
    const queryBuilder = new _SqlLiteQueryBuilder(
      this.model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      this.isNestedCondition,
      this.sqlDataSource
    );
    queryBuilder.selectQuery = this.selectQuery;
    queryBuilder.whereQuery = this.whereQuery;
    queryBuilder.joinQuery = this.joinQuery;
    queryBuilder.groupByQuery = this.groupByQuery;
    queryBuilder.orderByQuery = this.orderByQuery;
    queryBuilder.limitQuery = this.limitQuery;
    queryBuilder.offsetQuery = this.offsetQuery;
    queryBuilder.params = [...this.params];
    queryBuilder.relations = [...this.relations];
    return queryBuilder;
  }
  groupFooterQuery() {
    return this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
  }
  promisifyQuery(query, params) {
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.all(query, params, (err, result) => {
        if (err) {
          reject(err);
        }
        if (!result) {
          resolve([]);
        }
        if (!Array.isArray(result)) {
          resolve([result]);
        }
        resolve(result);
      });
    });
  }
};

// src/sql/sqlite/sql_lite_update_query_builder.ts
var SqliteUpdateQueryBuilder = class _SqliteUpdateQueryBuilder extends ModelUpdateQueryBuilder {
  /**
   * @description Constructs a Mysql_query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param sqlLiteCOnnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  constructor(model, table, sqlLiteConnection, logs, isNestedCondition = false, sqlDataSource, sqlModelManagerUtils) {
    super(model, table, logs, false, sqlDataSource);
    this.joinQuery = "";
    this.isNestedCondition = false;
    this.sqlConnection = sqlLiteConnection;
    this.updateTemplate = UPDATE_default(
      this.sqlDataSource.getDbType(),
      this.model
    );
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
    this.sqlModelManagerUtils = sqlModelManagerUtils;
  }
  /**
   * @description Updates a record in the database.
   * @param data - The data to update.
   * @param trx - The transaction to run the query in.
   * @returns The updated records.
   */
  async withData(data, options) {
    const { ignoreBeforeUpdateHook } = options || {};
    if (!ignoreBeforeUpdateHook) {
      this.model.beforeUpdate(this);
    }
    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
      values.length + 1
    );
    const { query, params } = this.updateTemplate.massiveUpdate(
      columns,
      values,
      this.whereQuery,
      this.joinQuery
    );
    params.push(...this.params);
    log(query, this.logs, params);
    try {
      const result = await this.promisifyQuery(query, params);
      return result;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  whereBuilder(cb) {
    const queryBuilder = new _SqliteUpdateQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  /**
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  orWhereBuilder(cb) {
    const nestedBuilder = new _SqliteUpdateQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  /**
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  andWhereBuilder(cb) {
    const nestedBuilder = new _SqliteUpdateQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  promisifyQuery(query, params) {
    return new Promise((resolve, reject) => {
      this.sqlConnection.run(query, params, function(err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes);
      });
    });
  }
};

// src/sql/sqlite/sql_lite_delete_query_builder.ts
var import_luxon4 = require("luxon");
var SqlLiteDeleteQueryBuilder = class _SqlLiteDeleteQueryBuilder extends ModelDeleteQueryBuilder {
  /**
   * @description Constructs a Mysql_query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param sqlConnection - The Sqlite connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  constructor(model, table, sqlConnection, logs, isNestedCondition = false, sqlDataSource, sqlModelManagerUtils) {
    super(model, table, logs, false, sqlDataSource);
    this.isNestedCondition = false;
    this.sqlConnection = sqlConnection;
    this.updateTemplate = UPDATE_default(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = DELETE_default(table, sqlDataSource.getDbType());
    this.joinQuery = "";
    this.isNestedCondition = isNestedCondition;
    this.isNestedCondition = isNestedCondition;
    this.sqlModelManagerUtils = sqlModelManagerUtils;
  }
  async delete(options = {}) {
    const { ignoreBeforeDeleteHook } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery
    );
    log(query, this.logs, this.params);
    try {
      return await this.promisifyQuery(query, this.params);
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  async softDelete(options) {
    const {
      column: column2 = "deletedAt",
      value = import_luxon4.DateTime.local().toISO(),
      ignoreBeforeDeleteHook = false
    } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    let { query, params } = this.updateTemplate.massiveUpdate(
      [column2],
      [value],
      this.whereQuery,
      this.joinQuery
    );
    params = [...params, ...this.params];
    log(query, this.logs, params);
    try {
      return await this.promisifyQuery(query, params);
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  whereBuilder(cb) {
    const queryBuilder = new _SqlLiteDeleteQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  /**
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  orWhereBuilder(cb) {
    const nestedBuilder = new _SqlLiteDeleteQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  /**
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  andWhereBuilder(cb) {
    const nestedBuilder = new _SqlLiteDeleteQueryBuilder(
      this.model,
      this.table,
      this.sqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
      this.sqlModelManagerUtils
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  promisifyQuery(query, params) {
    return new Promise((resolve, reject) => {
      this.sqlConnection.run(query, params, function(err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes);
      });
    });
  }
};

// src/sql/sqlite/sql_lite_model_manager.ts
var SqliteModelManager = class extends ModelManager {
  /**
   * Constructor for SqLiteModelManager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Pool} sqLiteConnection - sqlite connection.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model, sqLiteConnection, logs, sqlDataSource) {
    super(model, logs, sqlDataSource);
    this.sqLiteConnection = sqLiteConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils(
      "sqlite",
      sqLiteConnection
    );
  }
  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  async find(input) {
    try {
      if (!input) {
        return await this.query().many();
      }
      const query = this.query();
      if (input.select) {
        query.select(...input.select);
      }
      if (input.relations) {
        query.addRelations(input.relations);
      }
      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }
      if (input.orderBy) {
        query.orderBy(input.orderBy.columns, input.orderBy.type);
      }
      if (input.limit) {
        query.limit(input.limit);
      }
      if (input.offset) {
        query.offset(input.offset);
      }
      if (input.groupBy) {
        query.groupBy(...input.groupBy);
      }
      return await query.many({ ignoreHooks: input.ignoreHooks || [] });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    try {
      const query = this.query();
      if (input.select) {
        query.select(...input.select);
      }
      if (input.relations) {
        query.addRelations(input.relations);
      }
      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }
      return await query.one({
        throwErrorOnNull: input.throwErrorOnNull || false,
        ignoreHooks: input.ignoreHooks || []
      });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneByPrimaryKey(value, throwErrorOnNull = false) {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " + this.model.table + " has no primary key to be retrieved by"
        );
      }
      return await this.query().where(this.model.primaryKey, value).one({
        throwErrorOnNull
      });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {SqliteTransaction} trx - SqliteTransaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  async insert(model) {
    this.model.beforeInsert(model);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    try {
      const { query: query2, params: params2 } = this.sqlModelManagerUtils.parseInsert(
        model,
        this.model,
        this.sqlDataSource.getDbType()
      );
      log(query2, this.logs, params2);
      return await this.promisifyQuery(query2, params2, {
        isCreate: true,
        models: model
      });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {SqliteTransaction} trx - SqliteTransaction to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  async insertMany(models) {
    models.forEach((model) => {
      this.model.beforeInsert(model);
    });
    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models,
      this.model,
      this.sqlDataSource.getDbType()
    );
    try {
      const { query: query2, params: params2 } = this.sqlModelManagerUtils.parseMassiveInsert(
        models,
        this.model,
        this.sqlDataSource.getDbType()
      );
      log(query2, this.logs, params2);
      return await this.promisifyQuery(query2, params2, {
        isInsertMany: true,
        models
      });
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {SqliteTransaction} trx - SqliteTransaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async updateRecord(model) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be updated, try save"
      );
    }
    try {
      const updateQuery = this.sqlModelManagerUtils.parseUpdate(
        model,
        this.model,
        this.sqlDataSource.getDbType()
      );
      log(updateQuery.query, this.logs, updateQuery.params);
      await this.promisifyQuery(updateQuery.query, updateQuery.params);
      return await this.findOneByPrimaryKey(
        model[this.model.primaryKey]
      );
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param trx - SqliteTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteRecord(model) {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " + this.model.table + " has no primary key to be deleted from"
        );
      }
      const { query, params } = this.sqlModelManagerUtils.parseDelete(
        this.model.table,
        this.model.primaryKey,
        model[this.model.primaryKey]
      );
      log(query, this.logs, params);
      await this.promisifyQuery(query, params);
      return model;
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }
  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of Mysql_query_builder.
   */
  query() {
    return new SqlLiteQueryBuilder(
      this.model,
      this.model.table,
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
  /**
   * @description Returns an update query builder.
   */
  update() {
    return new SqliteUpdateQueryBuilder(
      this.model,
      this.model.table,
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource,
      this.sqlModelManagerUtils
    );
  }
  /**
   * @description Returns a delete query builder.
   */
  deleteQuery() {
    return new SqlLiteDeleteQueryBuilder(
      this.model,
      this.model.table,
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource,
      this.sqlModelManagerUtils
    );
  }
  promisifyQuery(query, params, options = {
    isCreate: false,
    isInsertMany: false,
    models: []
  }) {
    const primaryKeyName = this.model.primaryKey;
    if (options.isCreate || options.isInsertMany) {
      if (options.isCreate) {
        const table2 = this.model.table;
        const sqLiteConnection2 = this.sqLiteConnection;
        return new Promise((resolve, reject) => {
          this.sqLiteConnection.run(
            query,
            params,
            function(err) {
              if (err) {
                return reject(err);
              }
              const currentModel = options.models;
              const lastID = currentModel[primaryKeyName] || this.lastID;
              const selectQuery = `SELECT * FROM ${table2} WHERE ${primaryKeyName} = ?`;
              sqLiteConnection2.get(
                selectQuery,
                [lastID],
                (err2, row) => {
                  if (err2) {
                    return reject(err2);
                  }
                  resolve(row);
                }
              );
            }
          );
        });
      }
      if (!Array.isArray(options.models)) {
        throw new Error(
          "Models should be an array when massive creating on sqlite"
        );
      }
      const models = options.models;
      const table = this.model.table;
      const finalResult = [];
      const sqLiteConnection = this.sqLiteConnection;
      return new Promise((resolve, reject) => {
        models.forEach((model) => {
          const { query: query2, params: params2 } = this.sqlModelManagerUtils.parseInsert(
            model,
            this.model,
            this.sqlDataSource.getDbType()
          );
          this.sqLiteConnection.run(query2, params2, function(err) {
            if (err) {
              return reject(err);
            }
            const lastID = model[primaryKeyName] || this.lastID;
            const selectQuery = `SELECT * FROM ${table} WHERE ${primaryKeyName} = ?`;
            sqLiteConnection.get(selectQuery, [lastID], (err2, row) => {
              if (err2) {
                return reject(err2);
              }
              finalResult.push(row);
              if (finalResult.length === models.length) {
                resolve(finalResult);
              }
            });
          });
        });
      });
    }
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.all(query, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
};

// src/sql/resources/query/TRANSACTION.ts
var BEGIN_TRANSACTION = "BEGIN; \n";
var COMMIT_TRANSACTION = "COMMIT; \n";
var ROLLBACK_TRANSACTION = "ROLLBACK; \n";

// src/sql/transaction.ts
var Transaction = class {
  constructor(sqlDataSource, logs = false) {
    this.sqlDataSource = sqlDataSource;
    this.sqlConnection = this.sqlDataSource.getCurrentConnection();
    this.logs = logs;
  }
  async startTransaction() {
    try {
      switch (this.sqlDataSource.getDbType()) {
        case "mysql":
        case "mariadb":
          log(BEGIN_TRANSACTION, this.logs);
          await this.sqlConnection.beginTransaction();
          break;
        case "postgres":
          log(BEGIN_TRANSACTION, this.logs);
          await this.sqlConnection.query(BEGIN_TRANSACTION);
          break;
        case "sqlite":
          log(BEGIN_TRANSACTION, this.logs);
          this.sqlConnection.run(BEGIN_TRANSACTION, (err) => {
            if (err) {
              throw new Error(err.message);
            }
          });
          break;
        default:
          throw new Error("Invalid database type while beginning transaction");
      }
    } catch (error) {
      await this.releaseConnection();
    }
  }
  async commit() {
    try {
      switch (this.sqlDataSource.getDbType()) {
        case "mysql":
        case "mariadb":
          log(COMMIT_TRANSACTION, this.logs);
          await this.sqlConnection.commit();
          break;
        case "postgres":
          log(COMMIT_TRANSACTION, this.logs);
          await this.sqlConnection.query(COMMIT_TRANSACTION);
          break;
        case "sqlite":
          log(COMMIT_TRANSACTION, this.logs);
          this.sqlConnection.run(COMMIT_TRANSACTION, (err) => {
            if (err) {
              throw new Error(err.message);
            }
          });
          break;
        default:
          throw new Error("Invalid database type while committing transaction");
      }
    } catch (error) {
      throw error;
    } finally {
      await this.releaseConnection();
    }
  }
  async rollback() {
    try {
      switch (this.sqlDataSource.getDbType()) {
        case "mysql":
        case "mariadb":
          log(ROLLBACK_TRANSACTION, this.logs);
          await this.sqlConnection.rollback();
          break;
        case "postgres":
          log(ROLLBACK_TRANSACTION, this.logs);
          await this.sqlConnection.query(ROLLBACK_TRANSACTION);
          break;
        case "sqlite":
          log(ROLLBACK_TRANSACTION, this.logs);
          this.sqlConnection.run(ROLLBACK_TRANSACTION, (err) => {
            if (err) {
              throw new Error(err.message);
            }
          });
          break;
        default:
          throw new Error(
            "Invalid database type while rolling back transaction"
          );
      }
    } finally {
      await this.releaseConnection();
    }
  }
  async releaseConnection() {
    switch (this.sqlDataSource.getDbType()) {
      case "mysql":
      case "mariadb":
        await this.sqlConnection.end();
        break;
      case "postgres":
        await this.sqlConnection.end();
        break;
      case "sqlite":
        this.sqlConnection.close();
        break;
      default:
        throw new Error("Invalid database type while releasing connection");
    }
  }
};

// src/sql/sql_data_source.ts
var _SqlDataSource = class _SqlDataSource extends Datasource {
  constructor(input) {
    super(input);
    this.isConnected = false;
  }
  getDbType() {
    return this.type;
  }
  /**
   * @description Connects to the database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
   * @description The User input connection details will always come first
   */
  static async connect(input, cb) {
    const sqlDataSource = new this(input);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        sqlDataSource.sqlConnection = await import_promise.default.createConnection({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
          ...input?.mysqlOptions
        });
        break;
      case "postgres":
        sqlDataSource.sqlConnection = new import_pg.default.Client({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
          ...input?.pgOptions
        });
        await sqlDataSource.sqlConnection.connect();
        break;
      case "sqlite":
        sqlDataSource.sqlConnection = new import_sqlite3.default.Database(
          sqlDataSource.database,
          import_sqlite3.default.OPEN_READWRITE | import_sqlite3.default.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          }
        );
        break;
      default:
        throw new Error(`Unsupported datasource type: ${sqlDataSource.type}`);
    }
    sqlDataSource.isConnected = true;
    _SqlDataSource.instance = sqlDataSource;
    cb?.();
    return sqlDataSource;
  }
  static getInstance() {
    if (!this.instance) {
      throw new Error("sql database connection not established");
    }
    return _SqlDataSource.instance;
  }
  /**
   * @description Starts a transaction on the database and returns the transaction object
   * @param model
   * @returns {Promise<Transaction>} trx
   */
  async startTransaction(driverSpecificOptions) {
    const sqlDataSource = new _SqlDataSource({
      type: this.type,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      logs: this.logs,
      ...driverSpecificOptions
    });
    await sqlDataSource.connectDriver();
    sqlDataSource.isConnected = true;
    const mysqlTrx = new Transaction(sqlDataSource, this.logs);
    await mysqlTrx.startTransaction();
    return mysqlTrx;
  }
  /**
   * @description Alias for startTransaction
   * @returns {Promise<Transaction>} trx
   */
  async beginTransaction(driverSpecificOptions) {
    return this.startTransaction(driverSpecificOptions);
  }
  /**
   * @description Alias for startTransaction
   * @returns {Promise<Transaction>} trx
   */
  async transaction(driverSpecificOptions) {
    return this.startTransaction(driverSpecificOptions);
  }
  /**
   * @description Returns model manager for the provided model
   * @param model
   */
  getModelManager(model) {
    if (!this.isConnected) {
      throw new Error("sql database connection not established");
    }
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return new MysqlModelManager(
          model,
          this.sqlConnection,
          this.logs,
          this
        );
      case "postgres":
        return new PostgresModelManager(
          model,
          this.sqlConnection,
          this.logs,
          this
        );
      case "sqlite":
        return new SqliteModelManager(
          model,
          this.sqlConnection,
          this.logs,
          this
        );
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
  /**
   * @description Executes a callback function with the provided connection details
   * @description Static Model methods will always use the base connection created with SqlDataSource.connect() method
   * @param connectionDetails
   * @param cb
   */
  static async useConnection(connectionDetails, cb) {
    const customSqlInstance = new _SqlDataSource(connectionDetails);
    await customSqlInstance.connectDriver({
      mysqlOptions: connectionDetails.mysqlOptions,
      pgOptions: connectionDetails.pgOptions
    });
    customSqlInstance.isConnected = true;
    try {
      await cb(customSqlInstance).then(async () => {
        if (!customSqlInstance.isConnected) {
          return;
        }
        await customSqlInstance.closeConnection();
      });
    } catch (error) {
      if (customSqlInstance.isConnected) {
        await customSqlInstance.closeConnection();
      }
      throw error;
    }
  }
  /**
   * @description Returns the current connection
   * @returns {Promise<SqlConnectionType>} sqlConnection
   */
  getCurrentConnection() {
    return this.sqlConnection;
  }
  /**
   * @description Returns separate raw sql connection
   */
  async getRawConnection(driverSpecificOptions) {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return await (0, import_promise.createConnection)({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.mysqlOptions
        });
      case "postgres":
        const client = new import_pg.default.Client({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.pgOptions
        });
        await client.connect();
        return client;
      case "sqlite":
        return new import_sqlite3.default.Database(
          this.database,
          import_sqlite3.default.OPEN_READWRITE | import_sqlite3.default.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          }
        );
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
  /**
   * @description Closes the connection to the database
   * @returns
   */
  async closeConnection() {
    if (!this.isConnected) {
      logger_default.warn("Connection already closed", this);
      return;
    }
    logger_default.warn("Closing connection", this);
    switch (this.type) {
      case "mysql":
      case "mariadb":
        await this.sqlConnection.end();
        this.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      case "postgres":
        await this.sqlConnection.end();
        this.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      case "sqlite":
        await new Promise((resolve, reject) => {
          this.sqlConnection.close((err) => {
            if (err) {
              reject(err);
            }
            resolve();
          });
        });
        this.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
  /**
   * @description Executes a raw query on the database
   * @param query
   * @param params
   * @returns
   */
  async rawQuery(query, params = []) {
    if (!this.isConnected) {
      throw new Error("sql database connection not established");
    }
    log(query, this.logs, params);
    switch (this.type) {
      case "mysql":
      case "mariadb":
        const [mysqlRows] = await this.sqlConnection.execute(query, params);
        return mysqlRows;
      case "postgres":
        const { rows } = await this.sqlConnection.query(
          query,
          params
        );
        return rows;
      case "sqlite":
        return new Promise((resolve, reject) => {
          this.sqlConnection.all(
            query,
            params,
            (err, rows2) => {
              if (err) {
                reject(err);
              }
              resolve(rows2);
            }
          );
        });
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
  /**
   * @description Executes a raw query on the database with the base connection created with SqlDataSource.connect() method
   * @param query
   * @param params
   * @returns
   */
  static async rawQuery(query, params = []) {
    const sqlDataSource = _SqlDataSource.getInstance();
    if (!sqlDataSource || !sqlDataSource.isConnected) {
      throw new Error("sql database connection not established");
    }
    log(query, _SqlDataSource.getInstance()?.logs ?? false, params);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        const [mysqlRows] = await sqlDataSource.sqlConnection.execute(query, params);
        return mysqlRows;
      case "postgres":
        const { rows } = await sqlDataSource.sqlConnection.query(
          query,
          params
        );
        return rows;
      case "sqlite":
        return new Promise((resolve, reject) => {
          sqlDataSource.sqlConnection.all(
            query,
            params,
            (err, rows2) => {
              if (err) {
                reject(err);
              }
              resolve(rows2);
            }
          );
        });
      default:
        throw new Error(`Unsupported datasource type: ${sqlDataSource.type}`);
    }
  }
  async connectDriver(driverSpecificOptions) {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        this.sqlConnection = await import_promise.default.createConnection({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.mysqlOptions
        });
        break;
      case "postgres":
        this.sqlConnection = new import_pg.default.Client({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.pgOptions
        });
        await this.sqlConnection.connect();
        break;
      case "sqlite":
        this.sqlConnection = new import_sqlite3.default.Database(
          this.database,
          import_sqlite3.default.OPEN_READWRITE | import_sqlite3.default.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          }
        );
        break;
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
};
_SqlDataSource.instance = null;
var SqlDataSource = _SqlDataSource;

// src/sql/models/model.ts
function getBaseTable(target) {
  const className = target.name;
  const table = className.endsWith("s") ? convertCase(className, "snake") : convertCase(className, "snake") + "s";
  return table;
}
function getBaseModelInstance() {
  return { extraColumns: {} };
}
var tableMap = /* @__PURE__ */ new WeakMap();
var primaryKeyMap = /* @__PURE__ */ new WeakMap();
var Model = class {
  /**
   * @description Static getter for table;
   * @internal
   */
  static get table() {
    if (!tableMap.has(this)) {
      tableMap.set(this, this.tableName || getBaseTable(this));
    }
    return tableMap.get(this);
  }
  /**
   * @description Getter for the primary key of the model
   */
  static get primaryKey() {
    if (!primaryKeyMap.has(this)) {
      primaryKeyMap.set(this, getPrimaryKey(this));
    }
    return primaryKeyMap.get(this);
  }
  /**
   * @description Constructor for the model, it's not meant to be used directly, it just initializes the extraColumns, it's advised to only use the static methods to interact with the Model instances
   */
  constructor() {
    this.extraColumns = {};
  }
  /**
   * @description Gives a query instance for the given model
   * @param model
   * @returns {ModelQueryBuilder<T>}
   */
  static query(options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return modelManager.query();
  }
  /**
   * @description Finds the first record in the database
   * @param model
   * @param {FindType} options
   * @returns {Promise<T[]>}
   */
  static async first(options = { throwErrorOnNull: false }) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return await modelManager.query().one(options);
  }
  /**
   * @description Finds records for the given model
   * @param model
   * @param {FindType} options
   * @returns {Promise<T[]>}
   */
  static find(options) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager({
      trx: options?.trx,
      useConnection: options?.useConnection
    });
    return modelManager.find(options);
  }
  /**
   * @description Finds a record for the given model
   * @param model
   * @param {FindOneType} options
   * @returns {Promise<T | null>}
   */
  static findOne(options) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return modelManager.findOne(options);
  }
  /**
   * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
   * @param model
   * @param {number | string} id
   * @returns {Promise<T | null>}
   */
  static findOneByPrimaryKey(value, options = {
    throwErrorOnNull: false
  }) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return modelManager.findOneByPrimaryKey(value, options.throwErrorOnNull);
  }
  /**
   * @description Refreshes a model from the database, the model must have a primary key defined
   * @param model
   */
  static refresh(model, options = {
    throwErrorOnNull: false
  }) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    const primaryKey = typeofModel.primaryKey;
    const primaryKeyValue = model[primaryKey];
    return modelManager.findOneByPrimaryKey(
      primaryKeyValue,
      options.throwErrorOnNull
    );
  }
  /**
   * @description Saves a new record to the database
   * @description While using mysql, it will return records only if the primary key is auto incrementing integer, else it will always return null
   * @param model
   * @param {Model} modelData
   * @param trx
   * @returns {Promise<T | null>}
   */
  static insert(modelData, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return modelManager.insert(modelData);
  }
  /**
   * @description Saves multiple records to the database
   * @description WHile using mysql, it will return records only if the primary key is auto incrementing integer, else it will always return []
   * @param model
   * @param {Model} modelsData
   * @param trx
   * @returns {Promise<T[]>}
   */
  static insertMany(modelsData, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return modelManager.insertMany(modelsData);
  }
  /**
   * @description Updates a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns
   */
  static updateRecord(modelInstance, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return modelManager.updateRecord(modelInstance);
  }
  /**
   * @description Finds the first record or creates a new one if it doesn't exist
   * @param model
   * @param {Partial<T>} searchCriteria
   * @param {Partial<T>} createData
   */
  static async firstOrCreate(searchCriteria, createData, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    const doesExist = await modelManager.findOne({
      where: searchCriteria
    });
    if (doesExist) {
      return doesExist;
    }
    return await modelManager.insert(createData);
  }
  /**
   * @description Updates or creates a new record
   * @param {Partial<T>} searchCriteria
   * @param {Partial<T>} data
   * @param options - The options to update the record on conflict, default is true
   */
  static async upsert(searchCriteria, data, options = {
    updateOnConflict: true
  }) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    const doesExist = await modelManager.findOne({
      where: searchCriteria
    });
    if (doesExist) {
      data[typeofModel.primaryKey] = doesExist[typeofModel.primaryKey];
      if (options.updateOnConflict) {
        return await modelManager.updateRecord(data);
      }
      return doesExist;
    }
    return await modelManager.insert(data);
  }
  /**
   * @description Updates or creates multiple records
   * @param {Partial<T>} searchCriteria
   * @param {Partial<T>} data
   * @param options - The options to update the record on conflict, default is true
   * @returns - The updated or created records
   */
  static async upsertMany(searchCriteria, data, options = {
    updateOnConflict: true
  }) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    if (!data.every(
      (record) => searchCriteria.every((column2) => column2 in record)
    )) {
      throw new Error(
        "Conflict columns are not present in the data, please make sure to include them in the data, " + searchCriteria.join(", ")
      );
    }
    const results = [];
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const search = searchCriteria.reduce((acc, column2) => {
        acc[column2] = record[column2];
        return acc;
      }, {});
      const doesExist = await modelManager.findOne({
        where: search
      });
      if (doesExist) {
        record[typeofModel.primaryKey] = doesExist[typeofModel.primaryKey];
        if (options.updateOnConflict) {
          results.push(await modelManager.updateRecord(record));
          continue;
        }
        results.push(doesExist);
        continue;
      }
      results.push(await modelManager.insert(record));
    }
    return results;
  }
  /**
   * @description Updates records to the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns Update query builder
   */
  static update(options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return modelManager.update();
  }
  /**
   * @description Gives a Delete query builder instance
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns
   */
  static deleteQuery(options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return modelManager.deleteQuery();
  }
  /**
   * @description Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns
   */
  static deleteRecord(modelInstance, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.getModelManager(options);
    return modelManager.deleteRecord(modelInstance);
  }
  /**
   * @description Soft Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param options - The options to soft delete the record, column and value - Default is 'deletedAt' for column and the current date and time for value, string is always counted as a Date stringified as new Date().toString()
   * @param trx
   * @returns
   */
  static async softDelete(modelInstance, options) {
    const typeofModel = this;
    const {
      column: column2 = "deletedAt",
      value = import_luxon5.DateTime.local().toISO()
    } = options || {};
    modelInstance[column2] = value;
    const modelManager = typeofModel.getModelManager({
      trx: options?.trx,
      useConnection: options?.useConnection
    });
    await modelManager.updateRecord(modelInstance);
    if (typeof value === "string") {
      modelInstance[column2] = import_luxon5.DateTime.fromISO(value);
    }
    modelInstance[column2] = value;
    return await parseDatabaseDataIntoModelResponse(
      [modelInstance],
      typeofModel
    );
  }
  /**
   * @description Adds dynamic columns to the model that are not defined in the Table and are defined in the model
   * @description It does not support custom connection or transaction
   * @param model
   * @param data
   * @param dynamicColumns
   * @returns
   */
  static async addDynamicColumns(data, dynamicColumns) {
    const typeofModel = this;
    typeofModel.establishConnection();
    if (Array.isArray(data)) {
      for (const model of data) {
        await addDynamicColumnsToModel(
          typeofModel,
          model,
          dynamicColumns
        );
      }
      return data;
    }
    if (!Array.isArray(data)) {
      await addDynamicColumnsToModel(
        typeofModel,
        data,
        dynamicColumns
      );
      return data;
    }
    for (const model of data.data) {
      await addDynamicColumnsToModel(
        typeofModel,
        model,
        dynamicColumns
      );
    }
    return data;
  }
  /**
   * @description Merges the provided data with the instance
   * @param instance
   * @param data
   * @returns {void}
   */
  static combineProps(instance, data) {
    for (const key in data) {
      Object.assign(instance, { [key]: data[key] });
    }
  }
  /**
   * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
   * @param queryBuilder
   */
  static beforeFetch(queryBuilder) {
    queryBuilder;
  }
  /**
   * @description Adds a beforeInsert clause to the model, adding the ability to modify the data after fetching the data
   * @param data
   * @returns {T}
   */
  static beforeInsert(data) {
    return data;
  }
  /**
   * @description Adds a beforeUpdate clause to the model, adding the ability to modify the query before updating the data
   * @param data
   */
  static beforeUpdate(queryBuilder) {
    queryBuilder;
  }
  /**
   * @description Adds a beforeDelete clause to the model, adding the ability to modify the query before deleting the data
   * @param data
   */
  static beforeDelete(queryBuilder) {
    queryBuilder;
  }
  /**
   * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
   * @param data
   * @returns {T}
   */
  static async afterFetch(data) {
    return data;
  }
  /**
   * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method, this is done automatically when using the static methods
   * @description This method is meant to be used only if you want to establish sql instance of the model directly
   * @internal
   * @returns {void}
   */
  static establishConnection() {
    const sql = SqlDataSource.getInstance();
    if (!sql) {
      throw new Error(
        "sql instance not initialized, did you defined it in SqlDataSource.connect static method?"
      );
    }
    this.sqlInstance = sql;
  }
  /**
   * @description Gives the correct model manager with the correct connection based on the options provided
   * @param this
   * @param options
   * @returns
   */
  static getModelManager(options) {
    if (options.useConnection) {
      return options.useConnection.getModelManager(
        this
      );
    }
    if (options.trx) {
      return options.trx.sqlDataSource.getModelManager(
        this
      );
    }
    const typeofModel = this;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance.getModelManager(typeofModel);
  }
};
/**
 * @description Defines the case convention for the model
 * @type {CaseConvention}
 */
Model.modelCaseConvention = "camel";
/**
 * @description Defines the case convention for the database, this should be the case convention you use in your database
 * @type {CaseConvention}
 */
Model.databaseCaseConvention = "snake";

// src/index.ts
var import_ioredis2 = require("ioredis");

// src/no_sql/redis/redis_data_source.ts
var import_ioredis = __toESM(require("ioredis"));
var Redis_data_source = class _Redis_data_source {
  constructor(input) {
    this.isConnected = false;
    const port = input?.port || +process.env.REDIS_PORT || 6379;
    this.redisConnection = new import_ioredis.default({
      host: input?.host || process.env.REDIS_HOST,
      username: input?.username || process.env.REDIS_USERNAME,
      port,
      password: input?.password || process.env.REDIS_PASSWORD,
      ...input
    });
  }
  /**
   * @description Connects to the redis database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
   * @description The User input connection details will always come first
   * @description This is intended as a singleton connection to the redis database, if you need multiple connections, use the getConnection method
   * @param {RedisDataSourceInput} input - Details for the redis connection
   */
  static async connect(input) {
    if (_Redis_data_source.isConnected) {
      return;
    }
    const port = input?.port || +process.env.REDIS_PORT || 6379;
    _Redis_data_source.redisConnection = new import_ioredis.default({
      host: input?.host || process.env.REDIS_HOST,
      username: input?.username || process.env.REDIS_USERNAME,
      port,
      password: input?.password || process.env.REDIS_PASSWORD,
      ...input
    });
    try {
      await _Redis_data_source.redisConnection.ping();
      _Redis_data_source.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to connect to Redis: ${error}`);
    }
  }
  /**
   * @description Establishes a connection to the redis database and returns the connection
   * @param input
   * @returns
   */
  static async getConnection(input) {
    const connection = new _Redis_data_source(input);
    await connection.redisConnection.ping();
    connection.isConnected = true;
    return connection;
  }
  /**
   * @description Sets a key-value pair in the redis database
   * @param {string} key - The key
   * @param {string} value - The value
   * @param {number} expirationTime - The expiration time in milliseconds
   * @returns {Promise<void>}
   */
  static async set(key, value, expirationTime) {
    expirationTime = expirationTime ? expirationTime / 1e3 : void 0;
    if (typeof value === "object" && !Buffer.isBuffer(value)) {
      value = JSON.stringify(value);
    }
    if (typeof value === "boolean") {
      value = value.toString();
    }
    try {
      if (expirationTime) {
        await _Redis_data_source.redisConnection.setex(
          key,
          expirationTime,
          value
        );
        return;
      }
      await _Redis_data_source.redisConnection.set(key, value);
    } catch (error) {
      throw new Error(`Failed to set key-value pair in Redis: ${error}`);
    }
  }
  /**
   * @description Gets the value of a key in the redis database
   * @param {string} key - The key
   * @returns {Promise<string>}
   */
  static async get(key) {
    try {
      const value = await _Redis_data_source.redisConnection.get(key);
      return _Redis_data_source.getValue(value);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }
  /**
   * @description Gets the value of a key in the redis database as a buffer
   */
  static async getBuffer(key) {
    try {
      return await _Redis_data_source.redisConnection.getBuffer(key);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }
  /**
   * @description Gets the value of a key in the redis database and deletes the key
   * @param {string} key - The key
   * @returns {Promise
   * <T | null>}
   */
  static async getAndDelete(key) {
    try {
      const value = await _Redis_data_source.redisConnection.get(key);
      await _Redis_data_source.redisConnection.del(key);
      return _Redis_data_source.getValue(value);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }
  /**
   * @description Deletes a key from the redis database
   * @param {string} key - The key
   * @returns {Promise<void>}
   */
  static async delete(key) {
    try {
      await _Redis_data_source.redisConnection.del(key);
    } catch (error) {
      throw new Error(`Failed to delete key from Redis: ${error}`);
    }
  }
  /**
   * @description Flushes all the data in the redis database
   * @returns {Promise<void>}
   */
  static async flushAll() {
    try {
      await _Redis_data_source.redisConnection.flushall();
    } catch (error) {
      throw new Error(`Failed to flush Redis database: ${error}`);
    }
  }
  /**
   * @description Returns the raw redis connection that uses the ioredis library
   * @returns {Redis}
   */
  static getRawConnection() {
    if (!_Redis_data_source.isConnected || !_Redis_data_source.redisConnection) {
      throw new Error("redis connection not established");
    }
    return _Redis_data_source.redisConnection;
  }
  /**
   * @description Disconnects from the redis database
   * @returns {Promise<void>}
   */
  static async disconnect() {
    try {
      await _Redis_data_source.redisConnection.quit();
      _Redis_data_source.isConnected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from Redis: ${error}`);
    }
  }
  /**
   * @description Sets a key-value pair in the redis database
   * @param {string} key - The key
   * @param {string} value - The value
   * @param {number} expirationTime - The expiration time in milliseconds
   * @returns {Promise<void>}
   */
  async set(key, value, expirationTime) {
    expirationTime = expirationTime ? expirationTime / 1e3 : void 0;
    if (typeof value === "object" && !Buffer.isBuffer(value)) {
      value = JSON.stringify(value);
    }
    if (typeof value === "boolean") {
      value = value.toString();
    }
    try {
      if (expirationTime) {
        await this.redisConnection.setex(key, expirationTime, value);
        return;
      }
      await this.redisConnection.set(key, value);
    } catch (error) {
      throw new Error(`Failed to set key-value pair in Redis: ${error}`);
    }
  }
  /**
   * @description Gets the value of a key in the redis database
   * @param {string} key - The key
   * @returns {Promise<string>}
   */
  async get(key) {
    try {
      const value = await this.redisConnection.get(key);
      return _Redis_data_source.getValue(value);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }
  /**
   * @description Gets the value of a key in the redis database as a buffer
   */
  async getBuffer(key) {
    try {
      return await this.redisConnection.getBuffer(key);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }
  /**
   * @description Gets the value of a key in the redis database and deletes the key
   * @param {string} key - The key
   * @returns {Promise
   * <T | null>}
   */
  async getAndDelete(key) {
    try {
      const value = await this.redisConnection.get(key);
      await this.redisConnection.del(key);
      return _Redis_data_source.getValue(value);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }
  /**
   * @description Deletes a key from the redis database
   * @param {string} key - The key
   * @returns {Promise<void>}
   */
  async delete(key) {
    try {
      await this.redisConnection.del(key);
    } catch (error) {
      throw new Error(`Failed to delete key from Redis: ${error}`);
    }
  }
  /**
   * @description Flushes all the data in the redis database
   * @returns {Promise<void>}
   */
  async flushAll() {
    try {
      await this.redisConnection.flushall();
    } catch (error) {
      throw new Error(`Failed to flush Redis database: ${error}`);
    }
  }
  /**
   * @description Returns the raw redis connection that uses the ioredis library
   * @returns {Redis}
   */
  getRawConnection() {
    if (!this.isConnected || !this.redisConnection) {
      throw new Error("redis connection not established");
    }
    return this.redisConnection;
  }
  /**
   * @description Disconnects from the redis database
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      await this.redisConnection.quit();
      this.isConnected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from Redis: ${error}`);
    }
  }
  static getValue(value) {
    if (!value) {
      return null;
    }
    try {
      const jsonVal = JSON.parse(value);
      return jsonVal;
    } catch (_error) {
    }
    if (value === "true" || value === "false") {
      return Boolean(value);
    }
    if (Number(value)) {
      return Number(value);
    }
    if (Array.isArray(value)) {
      return value;
    }
    return value;
  }
};

// test/Post.ts
var Post = class extends Model {
};
__decorateClass([
  column({ primaryKey: true })
], Post.prototype, "id", 2);
__decorateClass([
  column()
], Post.prototype, "userId", 2);
__decorateClass([
  column()
], Post.prototype, "title", 2);
__decorateClass([
  column()
], Post.prototype, "content", 2);
__decorateClass([
  belongsTo(() => User, "userId")
], Post.prototype, "user", 2);

// test/User.ts
var _User = class _User extends Model {
  static beforeFetch(queryBuilder) {
    queryBuilder.whereNull("deletedAt");
  }
  static async afterFetch(data) {
    if (!data.length) {
      return data;
    }
    return data.map((user) => {
      user.json = null;
      return user;
    });
  }
  async getFirstUser() {
    return await _User.query().one();
  }
};
_User.tableName = "users";
__decorateClass([
  column({ primaryKey: true })
], _User.prototype, "id", 2);
__decorateClass([
  column()
], _User.prototype, "name", 2);
__decorateClass([
  column()
], _User.prototype, "email", 2);
__decorateClass([
  column()
], _User.prototype, "signupSource", 2);
__decorateClass([
  column({ booleanColumn: true })
], _User.prototype, "isActive", 2);
__decorateClass([
  column()
], _User.prototype, "json", 2);
__decorateClass([
  column()
], _User.prototype, "createdAt", 2);
__decorateClass([
  column()
], _User.prototype, "updatedAt", 2);
__decorateClass([
  column()
], _User.prototype, "deletedAt", 2);
__decorateClass([
  hasMany(() => Post, "userId")
], _User.prototype, "posts", 2);
__decorateClass([
  hasOne(() => Post, "userId")
], _User.prototype, "post", 2);
__decorateClass([
  dynamicColumn("firstUser")
], _User.prototype, "getFirstUser", 1);
var User = _User;

// src/index.ts
(async () => {
  const sql = await SqlDataSource.connect();
  const user = await User.insertMany([
    {
      name: "sqlite1",
      email: "user12",
      signupSource: "email",
      isActive: true
    },
    {
      name: "sqlite2",
      email: "user13",
      signupSource: "email",
      isActive: true
    }
  ]);
  console.log(user);
  await sql.closeConnection();
})();
var src_default = {
  // sql
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
  // redis
  Redis: Redis_data_source
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Migration,
  Model,
  ModelDeleteQueryBuilder,
  ModelUpdateQueryBuilder,
  Redis,
  RedisOptions,
  Relation,
  SqlDataSource,
  belongsTo,
  column,
  getModelColumns,
  getPrimaryKey,
  getRelations,
  hasMany,
  hasOne
});
//# sourceMappingURL=index.js.map