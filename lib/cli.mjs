#!/usr/bin/env node
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/cli.ts
import { Command } from "commander";

// src/hysteria_cli/migration_create_connector.ts
import dotenv from "dotenv";
import path from "path";

// src/hysteria_cli/resources/migration_templates.ts
var Migration_templates = class {
  basicMigrationTemplate(js = false) {
    if (js) {
      return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up() {
    // Your migration logic here
  }

  async down() {
    // Your rollback logic here
  }
}
`;
    }
    return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up(): Promise<void> {
    // Your migration logic here
  }

  async down(): Promise<void> {
    // Your rollback logic here
  }
}
`;
  }
  selectAllFromMigrationsTemplate() {
    return `SELECT * FROM migrations;`;
  }
  migrationTableTemplateMysql() {
    return `CREATE TABLE IF NOT EXISTS \`migrations\`(
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NOT NULL,
    \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
  }
  migrationTableTemplatePg() {
    return `CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;
  }
  migrationTableTemplateSQLite() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return `CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT '${now}'
);`;
  }
};
var migration_templates_default = new Migration_templates();

// src/hysteria_cli/migration_create_connector.ts
import fs from "fs";

// src/utils/logger.ts
import winston from "winston";
var colors = {
  info: "\x1B[32m",
  warn: "\x1B[33m",
  error: "\x1B[31m"
};
var logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp }) => {
    const color = colors[level] || "\x1B[0m";
    return `${timestamp} ${color}${level}\x1B[0m: ${color}${message}\x1B[0m`;
  })
);
var consoleTransport = new winston.transports.Console();
var fileTransport = new winston.transports.File({ filename: "logfile.log" });
var logger = winston.createLogger({
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
var logger_default = logger;

// src/hysteria_cli/migration_create_connector.ts
dotenv.config();
function getOrCreateMigrationPath() {
  let migrationPath = process.env.MIGRATION_PATH || "database/migrations";
  let currentPath = path.resolve(process.cwd(), migrationPath);
  if (!fs.existsSync(currentPath)) {
    fs.mkdirSync(currentPath, { recursive: true });
  }
  return currentPath;
}
function migrationCreateConnector(name, js = false) {
  const migrationFolderPath = getOrCreateMigrationPath();
  const timestamp = (/* @__PURE__ */ new Date()).getTime();
  const migrationFileName = !js ? `${timestamp}_${name}.ts` : `${timestamp}_${name}.js`;
  const migrationFilePath = path.join(migrationFolderPath, migrationFileName);
  const migrationTemplate = migration_templates_default.basicMigrationTemplate(js);
  fs.writeFileSync(migrationFilePath, migrationTemplate);
  logger_default.info(`Migration created successfully at '${migrationFilePath}'.`);
}

// src/hysteria_cli/migration_run_connector.ts
import dotenv7 from "dotenv";

// src/hysteria_cli/postgres/run_migration.ts
import dotenv4 from "dotenv";

// src/sql/migrations/migration_controller.ts
var MigrationController = class {
  constructor(sqlDataSource, sqlConnection, sqlType) {
    this.sqlConnection = sqlConnection;
    this.sqlType = sqlType;
    this.sqlDataSource = sqlDataSource;
  }
  async upMigrations(migrations) {
    try {
      for (const migration of migrations) {
        await migration.up();
        const statements = migration.schema.queryStatements;
        for (const statement of statements) {
          if (!statement || statement === "" || statement === ";" || statement === ",") {
            continue;
          }
          await this.localQuery(statement);
        }
        await this.addMigrationToMigrationTable(migration);
        if (migration.afterUp) {
          await migration.afterUp(this.sqlDataSource);
        }
      }
    } catch (error) {
      throw error;
    }
  }
  async downMigrations(migrations) {
    migrations = migrations.reverse();
    try {
      for (const migration of migrations) {
        await migration.down();
        const statements = migration.schema.queryStatements;
        for (const statement of statements) {
          if (!statement || statement === "" || statement === ";" || statement === ",") {
            continue;
          }
          await this.localQuery(statement);
        }
        await this.deleteMigrationFromMigrationTable(migration);
        if (migration.afterDown) {
          await migration.afterDown(this.sqlDataSource);
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }
  async localQuery(text, params = []) {
    if (this.sqlType === "mysql" || this.sqlType === "mariadb") {
      text = text.replace(/PLACEHOLDER/g, "?");
      log(text, true, params);
      await this.sqlConnection.query(text, params);
      return;
    } else if (this.sqlType === "postgres") {
      let index = 1;
      text = text.replace(/PLACEHOLDER/g, () => `$${index++}`);
      log(text, true, params);
      await this.sqlConnection.query(text, params);
      return;
    } else if (this.sqlType === "sqlite") {
      text = text.replace(/PLACEHOLDER/g, "?");
      log(text, true, params);
      await new Promise((resolve, reject) => {
        this.sqlConnection.run(
          text,
          params,
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });
      return;
    }
    throw new Error("No database connection found while running migration");
  }
  async addMigrationToMigrationTable(migration) {
    const completeUtcTimestamp = /* @__PURE__ */ new Date();
    const timestamp = completeUtcTimestamp.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
    const insertMigrationSql = `INSERT INTO migrations (name, timestamp) VALUES (PLACEHOLDER, PLACEHOLDER)`;
    await this.localQuery(insertMigrationSql, [
      migration.migrationName,
      timestamp
    ]);
  }
  async deleteMigrationFromMigrationTable(migration) {
    const deleteMigrationSql = `DELETE FROM migrations WHERE name = PLACEHOLDER`;
    await this.localQuery(deleteMigrationSql, [migration.migrationName]);
  }
  async removeMigrationTable() {
    const dropMigrationTableSql = `
      DROP TABLE IF EXISTS migrations
    `;
    log(dropMigrationTableSql, true);
    await this.localQuery(dropMigrationTableSql);
  }
};

// src/sql/resources/query/TRANSACTION.ts
var BEGIN_TRANSACTION = "BEGIN; \n";
var COMMIT_TRANSACTION = "COMMIT; \n";
var ROLLBACK_TRANSACTION = "ROLLBACK; \n";

// src/data_source.ts
import dotenv2 from "dotenv";
dotenv2.config();
var DataSource = class {
  constructor(input) {
    if (this.type === "mongo") {
      this.handleMongoSource(input?.url);
      return;
    }
    this.handleSqlSource(input);
  }
  handleMongoSource(url) {
    this.type = "mongo";
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
          break;
        case "mongo":
          this.port = 27017;
          break;
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

// src/drivers/driver.ts
var Driver = class {
  constructor(driverSpecificOptions) {
    this.options = driverSpecificOptions;
  }
  static async createDriver(_driverSpecificOptions) {
    throw new Error("Cannot be used by abstract class");
  }
};

// src/drivers/driver_constants.ts
var DriverNotFoundError = class extends Error {
  constructor(driverName) {
    super(driverName);
    this.name = `Driver ${driverName} not found, it's likely not installed, try running npm install ${driverName}`;
  }
};

// src/drivers/pg_driver.ts
var PgDriver = class _PgDriver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "postgres";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const pg = await import("pg").catch(() => {
      throw new DriverNotFoundError("pg");
    });
    if (!pg) {
      throw new DriverNotFoundError("pg");
    }
    return new _PgDriver(pg.default, driverSpecificOptions);
  }
};

// src/drivers/mongo_driver.ts
var MongoDriver = class _MongoDriver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "postgres";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const mongo = await import("mongodb").catch(() => {
      throw new DriverNotFoundError("mongodb");
    });
    if (!mongo) {
      throw new DriverNotFoundError("mongodb");
    }
    return new _MongoDriver(mongo, driverSpecificOptions);
  }
};

// src/drivers/mysql_driver.ts
var MysqlDriver = class _MysqlDriver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "mysql";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const mysql2 = await import("mysql2/promise").catch(() => {
      throw new DriverNotFoundError("mysql2");
    });
    if (!mysql2) {
      throw new DriverNotFoundError("mysql");
    }
    return new _MysqlDriver(mysql2.default, driverSpecificOptions);
  }
};

// src/drivers/redis_driver.ts
var RedisDriver = class _RedisDriver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "postgres";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const redis = await import("ioredis").catch(() => {
      throw new DriverNotFoundError("ioredis");
    });
    if (!redis) {
      throw new DriverNotFoundError("ioredis");
    }
    return new _RedisDriver(redis, driverSpecificOptions);
  }
};

// src/drivers/sqlite3_driver.ts
var Sqlite3Driver = class _Sqlite3Driver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "postgres";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const sqlite3 = await import("sqlite3").catch(() => {
      throw new DriverNotFoundError("sqlite3");
    });
    if (!sqlite3) {
      throw new DriverNotFoundError("sqlite3");
    }
    return new _Sqlite3Driver(sqlite3.default, driverSpecificOptions);
  }
};

// src/drivers/drivers_factory.ts
var DriverFactory = class {
  static async getDriver(client, driverSpecificOptions) {
    switch (client) {
      case "mysql":
      case "mariadb":
        return MysqlDriver.createDriver(driverSpecificOptions);
      case "postgres":
        return PgDriver.createDriver(driverSpecificOptions);
      case "sqlite":
        return Sqlite3Driver.createDriver(driverSpecificOptions);
      case "mongo":
        return MongoDriver.createDriver(driverSpecificOptions);
      case "redis":
        return RedisDriver.createDriver(driverSpecificOptions);
      default:
        throw new Error(
          `Driver ${client} not found, il likely not installed, try running npm install ${client}`
        );
    }
  }
};

// src/sql/models/model.ts
import "reflect-metadata";

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
  constructor(model, columnName) {
    this.model = Model;
    this.columnName = "";
    this.relatedModel = "";
    this.model = model;
    this.columnName = columnName;
    this.relatedModel = this.model.table;
  }
};

// src/sql/models/relations/belongs_to.ts
var BelongsTo = class extends Relation {
  constructor(relatedModel, columnName, foreignKey) {
    super(relatedModel, columnName);
    this.foreignKey = foreignKey;
    this.type = "belongsTo" /* belongsTo */;
  }
};

// src/sql/models/relations/has_many.ts
var HasMany = class extends Relation {
  constructor(relatedModel, columnName, foreignKey) {
    super(relatedModel, columnName);
    this.type = "hasMany" /* hasMany */;
    this.foreignKey = foreignKey;
    this.type = "hasMany" /* hasMany */;
  }
};

// src/sql/models/relations/has_one.ts
var HasOne = class extends Relation {
  constructor(relatedModel, columnName, foreignKey) {
    super(relatedModel, columnName);
    this.foreignKey = foreignKey;
    this.type = "hasOne" /* hasOne */;
  }
};

// src/sql/models/relations/many_to_many.ts
var ManyToMany = class extends Relation {
  constructor(model, columnName, throughModel, foreignKey) {
    super(model, columnName);
    this.type = "manyToMany" /* manyToMany */;
    this.throughModel = "";
    this.foreignKey = "";
    this.relatedModelForeignKey = "";
    this.columnName = columnName;
    this.foreignKey = foreignKey;
    this.throughModel = throughModel;
  }
};

// src/sql/models/model_decorators.ts
var COLUMN_METADATA_KEY = Symbol("columns");
var DYNAMIC_COLUMN_METADATA_KEY = Symbol("dynamicColumns");
var PRIMARY_KEY_METADATA_KEY = Symbol("primaryKey");
var RELATION_METADATA_KEY = Symbol("relations");
function column(options = {
  primaryKey: false
}) {
  return (target, propertyKey) => {
    if (options.primaryKey) {
      const primaryKey = Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target);
      if (primaryKey) {
        throw new Error("Multiple primary keys are not allowed");
      }
      Reflect.defineMetadata(PRIMARY_KEY_METADATA_KEY, propertyKey, target);
    }
    const column2 = {
      columnName: propertyKey,
      serialize: options.serialize,
      prepare: options.prepare,
      hidden: options.hidden
    };
    const existingColumns = Reflect.getMetadata(COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(column2);
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
function belongsTo(model, foreignKey) {
  return (target, propertyKey) => {
    const relation = {
      type: "belongsTo" /* belongsTo */,
      columnName: propertyKey,
      model,
      foreignKey
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function hasOne(model, foreignKey) {
  return (target, propertyKey) => {
    const relation = {
      type: "hasOne" /* hasOne */,
      columnName: propertyKey,
      model,
      foreignKey
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function hasMany(model, foreignKey) {
  return (target, propertyKey) => {
    const relation = {
      type: "hasMany" /* hasMany */,
      columnName: propertyKey,
      model,
      foreignKey
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function manyToMany(model, throughModel, foreignKey) {
  return (target, propertyKey) => {
    if (!(typeof throughModel === "string")) {
      throughModel = throughModel().table;
    }
    const relation = {
      type: "manyToMany" /* manyToMany */,
      columnName: propertyKey,
      model,
      foreignKey,
      manyToManyOptions: {
        throughModel
      }
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function getRelations(target) {
  const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target.prototype) || [];
  return relations.map((relation) => {
    const { type, model, columnName, foreignKey } = relation;
    switch (type) {
      case "belongsTo" /* belongsTo */:
        return new BelongsTo(model(), columnName, foreignKey);
      case "hasOne" /* hasOne */:
        return new HasOne(model(), columnName, foreignKey);
      case "hasMany" /* hasMany */:
        return new HasMany(model(), columnName, foreignKey);
      case "manyToMany" /* manyToMany */:
        if (!relation.manyToManyOptions) {
          throw new Error("Many to many relation must have a through model");
        }
        return new ManyToMany(
          model(),
          columnName,
          relation.manyToManyOptions.throughModel,
          relation.foreignKey
        );
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
async function parseDatabaseDataIntoModelResponse(models, typeofModel, relationModels = [], modelSelectedColumns = []) {
  if (!models.length) {
    return null;
  }
  const relations = getRelations(typeofModel);
  const serializedModels = models.map((model) => {
    const serializedModel = serializeModel(
      model,
      typeofModel,
      modelSelectedColumns
    );
    processRelation(serializedModel, typeofModel, relations, relationModels);
    return serializedModel;
  });
  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
}
function serializeModel(model, typeofModel, modelSelectedColumns = []) {
  const casedModel = {};
  const columns = getModelColumns(typeofModel);
  const hiddenColumns = columns.filter((column2) => column2.hidden).map((column2) => column2.columnName);
  for (const key in model) {
    if (key === "$additionalColumns") {
      processAdditionalColumns(model, key, casedModel, typeofModel);
      continue;
    }
    if (!model.hasOwnProperty(key) || hiddenColumns.includes(key) || modelSelectedColumns.length && !modelSelectedColumns.includes(key)) {
      continue;
    }
    const originalValue = model[key];
    if (originalValue == null) {
      casedModel[convertCase(key, typeofModel.modelCaseConvention)] = originalValue;
      continue;
    }
    if (isRelationDefinition(originalValue)) {
      continue;
    }
    const camelCaseKey = convertCase(key, typeofModel.modelCaseConvention);
    if (isNestedObject(originalValue) && !Array.isArray(originalValue)) {
      casedModel[camelCaseKey] = convertToModelCaseConvention(
        originalValue,
        typeofModel
      );
      continue;
    }
    if (Array.isArray(originalValue)) {
      continue;
    }
    const modelColumn = columns.find((column2) => column2.columnName === key);
    if (modelColumn && modelColumn.serialize) {
      casedModel[camelCaseKey] = modelColumn.serialize(originalValue);
      continue;
    }
    casedModel[camelCaseKey] = originalValue;
  }
  return casedModel;
}
function processAdditionalColumns(model, key, casedModel, typeofModel) {
  if (!Object.keys(model[key]).length) {
    return;
  }
  const $additionalColumns = Object.keys(model[key]).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] = model[key][objKey];
      return acc;
    },
    {}
  );
  casedModel[key] = $additionalColumns;
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
        const casedPrimaryKey = convertCase(
          primaryKey,
          typeofModel.databaseCaseConvention
        );
        relatedModels.forEach((model) => {
          relatedModelMap.set(model[casedPrimaryKey], model);
        });
        const retrievedRelatedModel = relatedModelMap.get(
          serializedModel[foreignKey]
        );
        if (!retrievedRelatedModel) {
          serializedModel[relation.columnName] = null;
          return;
        }
        serializedModel[relation.columnName] = serializeModel(
          retrievedRelatedModel,
          relation.model
        );
        break;
      case "hasOne" /* hasOne */:
        const relatedModelMapHasOne = /* @__PURE__ */ new Map();
        const casedForeignKey = convertCase(
          foreignKey,
          typeofModel.databaseCaseConvention
        );
        relatedModels.forEach((model) => {
          relatedModelMapHasOne.set(
            model[casedForeignKey],
            model
          );
        });
        const retrievedRelatedModelHasOne = relatedModelMapHasOne.get(
          serializedModel[primaryKey]
        );
        if (!retrievedRelatedModelHasOne) {
          serializedModel[relation.columnName] = null;
          return;
        }
        serializedModel[relation.columnName] = serializeModel(
          retrievedRelatedModelHasOne,
          relation.model
        );
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
      case "manyToMany" /* manyToMany */:
        const relatedModelMapManyToMany = /* @__PURE__ */ new Map();
        relatedModels.forEach((model) => {
          relatedModelMapManyToMany.set(
            model[primaryKey],
            model
          );
        });
        const currentModelId = serializedModel[primaryKey];
        const relatedModel = relatedModelMapManyToMany.get(currentModelId);
        if (!relatedModel) {
          serializedModel[relation.columnName] = [];
          return;
        }
        let relatedColumnValue = relatedModel[relation.columnName];
        if (!relatedColumnValue) {
          relatedColumnValue = [];
        }
        if (!Array.isArray(relatedColumnValue)) {
          relatedColumnValue = [relatedColumnValue];
        }
        serializedModel[relation.columnName] = relatedColumnValue.map(
          (relatedItem) => serializeModel(relatedItem, relation.model)
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

// src/entity.ts
var Entity = class {
  constructor() {
    this.$additionalColumns = {};
  }
};
/**
 * @description Defines the case convention for the model
 * @type {CaseConvention}
 */
Entity.modelCaseConvention = "camel";
/**
 * @description Defines the case convention for the database, this should be the case convention you use in your database
 * @type {CaseConvention}
 */
Entity.databaseCaseConvention = "snake";

// src/utils/date_utils.ts
function baseSoftDeleteDate(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// src/sql/models/model.ts
function getBaseTableName(target) {
  const className = target.name;
  return className.endsWith("s") ? convertCase(className, "snake") : convertCase(className, "snake") + "s";
}
function getBaseModelInstance() {
  return { $additionalColumns: {} };
}
var tableMap = /* @__PURE__ */ new Map();
var primaryKeyMap = /* @__PURE__ */ new Map();
var Model = class extends Entity {
  /**
   * @description Static getter for table;
   * @internal
   */
  static get table() {
    if (!tableMap.has(this)) {
      tableMap.set(this, this.tableName || getBaseTableName(this));
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
   * @description Constructor for the model, it's not meant to be used directly, it just initializes the $additionalColumns, it's advised to only use the static methods to interact with the database to save the model
   * @description Using the constructor could lead to unexpected behavior, if you want to create a new record use the insert method
   * @deprecated
   */
  constructor() {
    super();
  }
  /**
   * @description Returns all the records for the given model
   */
  static async all(options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return await modelManager.find();
  }
  /**
   * @description Gives a query sqlInstance for the given model
   */
  static query(options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.query();
  }
  /**
   * @description Finds the first record in the database
   * @deprecated Used only for debugging purposes, use findOne or query instead
   */
  static async first(options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.query().one(options);
  }
  /**
   * @description Finds records for the given model
   */
  static async find(findOptions, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.find(findOptions);
  }
  /**
   * @description Finds a record for the given model or throws an error if it doesn't exist
   */
  static async findOneOrFail(findOneOptions, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.findOneOrFail(findOneOptions);
  }
  /**
   * @description Finds a record for the given model
   */
  static async findOne(findOneOptions, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.findOne(findOneOptions);
  }
  /**
   * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
   */
  static async findOneByPrimaryKey(value, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.findOneByPrimaryKey(value);
  }
  /**
   * @description Refreshes a model from the database, the model must have a primary key defined
   */
  static async refresh(model, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    const primaryKey = typeofModel.primaryKey;
    const primaryKeyValue = model[primaryKey];
    const refreshedModel = await modelManager.findOneByPrimaryKey(
      primaryKeyValue
    );
    if (!refreshedModel) {
      return null;
    }
    refreshedModel.$additionalColumns = model.$additionalColumns;
    return refreshedModel;
  }
  /**
   * @description Saves a new record to the database
   * @description $additionalColumns will be ignored if set in the modelData and won't be returned in the response
   */
  static async insert(modelData, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.insert(modelData);
  }
  /**
   * @description Saves multiple records to the database
   */
  static async insertMany(modelsData, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.insertMany(modelsData);
  }
  /**
   * @description Updates a record to the database
   */
  static async updateRecord(modelSqlInstance, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    const updatedModel = await modelManager.updateRecord(modelSqlInstance);
    if (!updatedModel) {
      return null;
    }
    updatedModel.$additionalColumns = modelSqlInstance.$additionalColumns;
    return updatedModel;
  }
  /**
   * @description Finds the first record or creates a new one if it doesn't exist
   */
  static async firstOrCreate(searchCriteria, createData, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
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
   */
  static async upsert(searchCriteria, data, options = {
    updateOnConflict: true
  }) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
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
   */
  static async upsertMany(searchCriteria, data, options = {
    updateOnConflict: true
  }) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
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
   * @description Deletes a record to the database
   */
  static async deleteRecord(modelSqlInstance, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.deleteRecord(modelSqlInstance);
  }
  /**
   * @description Soft Deletes a record to the database
   */
  static async softDelete(modelSqlInstance, options) {
    const typeofModel = this;
    const {
      column: column2 = "deletedAt",
      value = baseSoftDeleteDate(/* @__PURE__ */ new Date())
    } = options || {};
    modelSqlInstance[column2] = value;
    const modelManager = typeofModel.dispatchModelManager({
      trx: options?.trx,
      useConnection: options?.useConnection
    });
    await modelManager.updateRecord(modelSqlInstance);
    if (typeof value === "string") {
      modelSqlInstance[column2] = new Date(value);
    }
    modelSqlInstance[column2] = value;
    return await parseDatabaseDataIntoModelResponse(
      [modelSqlInstance],
      typeofModel
    );
  }
  /**
   * @description Adds dynamic columns to the model that are not defined in the Table and are defined in the model
   * @description It does not support custom connection or transaction
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
   * @description Merges the provided data with the sqlInstance
   */
  static combineProps(sqlInstance, data) {
    for (const key in data) {
      Object.assign(sqlInstance, { [key]: data[key] });
    }
  }
  /**
   * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
   */
  static beforeFetch(queryBuilder) {
    queryBuilder;
  }
  /**
   * @description Adds a beforeInsert clause to the model, adding the ability to modify the data after fetching the data
   */
  static beforeInsert(data) {
    return data;
  }
  /**
   * @description Adds a beforeUpdate clause to the model, adding the ability to modify the query before updating the data
   */
  static beforeUpdate(queryBuilder) {
    queryBuilder;
  }
  /**
   * @description Adds a beforeDelete clause to the model, adding the ability to modify the query before deleting the data
   */
  static beforeDelete(queryBuilder) {
    queryBuilder;
  }
  /**
   * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
   */
  static async afterFetch(data) {
    return data;
  }
  // JS Static methods
  /**
   * @description Defines a column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static column(columnName, options = {}) {
    column(options)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static hasOne(columnName, model, foreignKey) {
    hasOne(model, foreignKey)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static hasMany(columnName, model, foreignKey) {
    hasMany(model, foreignKey)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static belongsTo(columnName, model, foreignKey) {
    belongsTo(model, foreignKey)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static manyToMany(columnName, model, throughModel, foreignKey) {
    manyToMany(model, throughModel, foreignKey)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static dynamicColumn(columnName, func) {
    dynamicColumn(columnName)(this.prototype, func.name);
  }
  /**
   * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method, this is done automatically when using the static methods
   * @description This method is meant to be used only if you want to establish sql sqlInstance of the model directly
   * @internal
   */
  static establishConnection() {
    const sql = SqlDataSource.getInstance();
    if (!sql) {
      throw new Error(
        "sql sqlInstance not initialized, did you defined it in SqlDataSource.connect static method?"
      );
    }
    this.sqlInstance = sql;
  }
  /**
   * @description Gives the correct model manager with the correct connection based on the options provided
   */
  static dispatchModelManager(options) {
    if (options?.useConnection) {
      return options.useConnection.getModelManager(
        this
      );
    }
    if (options?.trx) {
      return options.trx.sqlDataSource.getModelManager(
        this
      );
    }
    const typeofModel = this;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance.getModelManager(typeofModel);
  }
};

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
  /**
   * @description Finds the first record that matches the input or throws an error
   */
  async findOneOrFail(input) {
    const result = await this.findOne(input);
    if (result === null) {
      if (input.customError) {
        throw input.customError;
      }
      throw new Error("ROW_NOT_FOUND");
    }
    return result;
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
  const modelColumns = getModelColumns(typeofModel);
  return {
    insert: (columns, values) => {
      if (columns.includes("$additionalColumns")) {
        const $additionalColumnsIndex = columns.indexOf("$additionalColumns");
        columns.splice(columns.indexOf("$additionalColumns"), 1);
        values.splice($additionalColumnsIndex, 1);
      }
      for (let i = 0; i < values.length; i++) {
        const column2 = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn2) => modelColumn2.columnName === column2
        );
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }
      columns = columns.map(
        (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
      );
      let placeholders;
      let params;
      switch (dbType) {
        case "mysql":
        case "mariadb":
          placeholders = columns.map((_, index) => {
            if (isNestedObject(values[index])) {
              return `?`;
            }
            return `?`;
          }).join(", ");
          params = values.map(
            (value) => isNestedObject(value) ? JSON.stringify(value) : value
          );
          break;
        case "sqlite":
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
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          const column2 = columns[j];
          const modelColumn = modelColumns.find(
            (modelColumn2) => modelColumn2.columnName === column2
          );
          if (modelColumn && modelColumn.prepare) {
            values[i][j] = modelColumn.prepare(values[i][j]);
          }
        }
      }
      switch (dbType) {
        case "mysql":
        case "mariadb":
          valueSets = values.map((valueSet) => {
            params.push(
              ...valueSet.map(
                (value) => isNestedObject(value) ? JSON.stringify(value) : value
              )
            );
            return `(${valueSet.map(() => "?").join(", ")})`;
          });
          break;
        case "sqlite":
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

// src/sql/resources/utils.ts
function generateManyToManyQuery({
  dbType,
  relationName,
  selectedColumns,
  leftTable,
  leftTablePrimaryColumn,
  rightTablePrimaryColumn,
  pivotLeftTableColumn,
  pivotRightTableColumn,
  rightTable,
  pivotTable,
  whereCondition,
  relatedModelColumns,
  havingQuery,
  limit,
  offset,
  orderBy
}) {
  let jsonAggFunction = "";
  let jsonObjectFunction = "";
  let jsonAlias = "";
  switch (dbType) {
    case "postgres":
      jsonAggFunction = "json_agg";
      jsonObjectFunction = "json_build_object";
      jsonAlias = "t.json_data";
      break;
    case "mysql":
    case "mariadb":
      jsonAggFunction = "JSON_ARRAYAGG";
      jsonObjectFunction = "JSON_OBJECT";
      jsonAlias = "t.json_data";
      break;
    case "sqlite":
      jsonAggFunction = "JSON_GROUP_ARRAY";
      jsonObjectFunction = "JSON_OBJECT";
      jsonAlias = "JSON(t.json_data)";
      break;
    default:
      throw new Error("Unsupported database type");
  }
  const columnsList = selectedColumns.map((col) => {
    if (col.includes("*")) {
      return relatedModelColumns.map((column2) => {
        return `'${column2}', ${rightTable}.${column2}`;
      }).join(",\n            ");
    }
    if (col.toLowerCase().includes("as")) {
      const [column2, alias2] = col.split(" as ");
      return `'${alias2}', ${column2}`;
    }
    if (!col.includes(".")) {
      return `'${col}', ${rightTable}.${col}`;
    }
    const alias = col.split(".").pop();
    return `'${alias}', ${col}`;
  }).join(",\n            ");
  let limitOffsetClause = "";
  if (limit) {
    limitOffsetClause += `LIMIT ${limit}`;
  }
  if (offset) {
    limitOffsetClause += ` OFFSET ${offset}`;
  }
  let query = `
  SELECT
    ${leftTable}.id AS ${leftTablePrimaryColumn},
    '${relationName}' AS relation_name,
    (
      SELECT ${jsonAggFunction}(${jsonAlias})
      FROM (
        SELECT ${jsonObjectFunction}(
          ${columnsList}
        ) AS json_data
        FROM ${rightTable}
        JOIN ${pivotTable} ON ${pivotTable}.${pivotRightTableColumn} = ${rightTable}.${rightTablePrimaryColumn}
        ${dbType === "mariadb" ? `JOIN ${leftTable} ON ${pivotTable}.${pivotLeftTableColumn} = ${leftTable}.${leftTablePrimaryColumn}` : ""}
        WHERE ${pivotTable}.${pivotLeftTableColumn} = ${leftTable}.${leftTablePrimaryColumn}`;
  if (whereCondition) {
    query += ` AND ${whereCondition.replace("WHERE", "")}`;
  }
  if (havingQuery) {
    query += ` HAVING ${havingQuery}`;
  }
  if (orderBy) {
    query += ` ${orderBy}`;
  }
  query += ` ${limitOffsetClause}
      ) t
    ) AS ${relationName}
  FROM ${leftTable};
  `;
  return query.trim();
}
function generateHasManyQuery({
  selectQuery,
  relationName,
  relatedModel,
  foreignKey,
  typeofModel,
  primaryKeyValues,
  joinQuery,
  whereQuery,
  groupByQuery,
  havingQuery,
  orderByQuery,
  extractedOffsetValue,
  extractedLimitValue,
  databaseType
}) {
  const foreignKeyConverted = convertCase(
    foreignKey,
    typeofModel.databaseCaseConvention
  );
  const primaryKeyValuesSQL = primaryKeyValues.map(({ value, type }) => convertValueToSQL(value, type)).join(", ");
  let rowNumberClause;
  if (databaseType === "mysql" || databaseType === "mariadb") {
    rowNumberClause = `ROW_NUMBER() OVER (PARTITION BY ${relatedModel}.${foreignKeyConverted} ORDER BY ${orderByQuery || `${relatedModel}.${foreignKeyConverted}`}) as row_num`;
  } else {
    rowNumberClause = `ROW_NUMBER() OVER (PARTITION BY ${relatedModel}.${foreignKeyConverted} ORDER BY ${orderByQuery || "1"}) as row_num`;
  }
  const hasManyQuery = `
    WITH CTE AS (
      SELECT ${selectQuery}, '${relationName}' as relation_name,
             ${rowNumberClause}
      FROM ${relatedModel}
      ${joinQuery}
      WHERE ${relatedModel}.${foreignKeyConverted} IN (${primaryKeyValuesSQL})
      ${whereQuery} ${groupByQuery} ${havingQuery}
    )
    SELECT * FROM CTE
    WHERE row_num > ${extractedOffsetValue || 0}
    ${extractedLimitValue ? `AND row_num <= (${extractedOffsetValue || 0} + ${extractedLimitValue})` : ""};
  `;
  return hasManyQuery;
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

// src/sql/resources/query/RELATION.ts
function parseValueType(value) {
  return typeof value;
}
function parseRelationQuery(relationQuery) {
  const selectQuery = relationQuery.selectedColumns?.join(", ") || "*";
  const joinQuery = relationQuery.joinQuery ? relationQuery.joinQuery : "";
  const orderByQuery = relationQuery.orderByQuery ? `ORDER BY ${relationQuery.orderByQuery}` : "";
  const groupByQuery = relationQuery.groupByQuery ? `GROUP BY ${relationQuery.groupByQuery}` : "";
  const limitQuery = relationQuery.limitQuery ? `LIMIT ${relationQuery.limitQuery}` : "";
  const offsetQuery = relationQuery.offsetQuery ? `OFFSET ${relationQuery.offsetQuery}` : "";
  const havingQuery = relationQuery.havingQuery ? `HAVING ${relationQuery.havingQuery}` : "";
  return {
    selectQuery,
    whereQuery: relationQuery.whereQuery || "",
    joinQuery,
    orderByQuery,
    groupByQuery,
    limitQuery,
    offsetQuery,
    havingQuery
  };
}
function relationTemplates(models, relation, relationName, relationQuery, typeofModel, dbType) {
  const primaryKey = relation.model.primaryKey;
  const foreignKey = relation.foreignKey;
  const relatedModel = relation.relatedModel;
  const {
    selectQuery,
    whereQuery,
    joinQuery,
    orderByQuery,
    groupByQuery,
    limitQuery,
    offsetQuery,
    havingQuery
  } = parseRelationQuery(relationQuery);
  const params = relationQuery.params || [];
  const extractedLimitValue = limitQuery.match(/\d+/)?.[0];
  const extractedOffsetValue = offsetQuery.match(/\d+/)?.[0] || 0;
  const primaryKeyValues = models.map((model) => {
    const value = model[convertCase(primaryKey, typeofModel.modelCaseConvention)];
    return { value, type: parseValueType(value) };
  });
  const foreignKeyValues = models.map((model) => {
    const value = model[convertCase(foreignKey, typeofModel.modelCaseConvention)];
    return { value, type: parseValueType(value) };
  });
  switch (relation.type) {
    case "hasOne" /* hasOne */:
      if (primaryKeyValues.some(({ value }) => !value)) {
        logger_default.error(
          `Foreign key values are missing for has one relation: ${relationName} ${foreignKeyValues}`
        );
        throw new Error(
          `Foreign key values are missing for has one relation: ${relationName} ${foreignKeyValues}`
        );
      }
      if (!primaryKey) {
        throw new Error(
          `Related Model ${relatedModel} does not have a primary key`
        );
      }
      if (!foreignKeyValues.length) {
        return {
          query: "",
          params
        };
      }
      const query = `SELECT ${selectQuery}, '${relationName}' as relation_name FROM ${relatedModel}
${joinQuery} WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention
      )} IN (${primaryKeyValues.map(({ value, type }) => convertValueToSQL(value, type)).join(", ")}) ${whereQuery};
      `;
      return {
        query,
        params
      };
    case "belongsTo" /* belongsTo */:
      if (foreignKeyValues.some(({ value }) => !value)) {
        logger_default.error(
          `Foreign key values are missing for belongs to relation: ${relationName} ${foreignKeyValues}`
        );
        throw new Error(
          `Foreign key values are missing for belongs to relation: ${relationName} ${foreignKeyValues}`
        );
      }
      if (!primaryKey) {
        throw new Error(
          `Related Model ${relatedModel} does not have a primary key`
        );
      }
      if (!foreignKeyValues.length) {
        return {
          query: "",
          params: []
        };
      }
      const belongsToQuery = `SELECT ${selectQuery}, '${relationName}' as relation_name FROM ${relatedModel}
${joinQuery}  WHERE ${relatedModel}.${primaryKey} IN (${foreignKeyValues.map(({ value, type }) => convertValueToSQL(value, type)).join(
        ", "
      )}) ${whereQuery} ${groupByQuery} ${havingQuery} ${orderByQuery} ${limitQuery} ${offsetQuery};
`;
      return {
        query: belongsToQuery,
        params
      };
    case "hasMany" /* hasMany */:
      if (primaryKeyValues.some(({ value }) => !value)) {
        logger_default.error(
          `Primary key values are missing for has many relation: ${relationName} ${primaryKeyValues}`
        );
        throw new Error(
          `Primary key values are missing for has many relation: ${relationName} ${primaryKeyValues}`
        );
      }
      if (!primaryKeyValues.length) {
        return {
          query: "",
          params: []
        };
      }
      return {
        query: generateHasManyQuery({
          selectQuery,
          relationName,
          relatedModel,
          foreignKey,
          typeofModel,
          primaryKeyValues,
          joinQuery,
          whereQuery,
          groupByQuery,
          havingQuery,
          orderByQuery,
          extractedOffsetValue,
          extractedLimitValue,
          databaseType: dbType
        }),
        params
      };
    case "manyToMany" /* manyToMany */:
      if (primaryKeyValues.some(({ value }) => !value)) {
        logger_default.error(
          `Primary key values are missing for many to many relation: ${relationName} ${primaryKeyValues}`
        );
        throw new Error(
          `Primary key values are missing for many to many relation: ${relationName} ${primaryKeyValues}`
        );
      }
      if (!primaryKeyValues.length) {
        return {
          query: "",
          params: []
        };
      }
      const throughModel = relation.throughModel;
      const throughModelPrimaryKey = relation.foreignKey;
      const relatedModelTable = relation.relatedModel;
      const relatedModelPrimaryKey = relation.model.primaryKey;
      const relatedModeRelations = getRelations(relation.model);
      const relatedModelManyToManyRelation = relatedModeRelations.find(
        (relation2) => relation2.type === "manyToMany" /* manyToMany */ && relation2.throughModel === throughModel
      );
      if (!relatedModelManyToManyRelation || !relatedModelManyToManyRelation.foreignKey) {
        throw new Error(
          `Many to many relation not found for related model ${relatedModel} and through model ${throughModel}, the error is likely in the relation definition and was called by relation ${relationName} in model ${typeofModel.tableName}`
        );
      }
      const relatedModelForeignKey = relatedModelManyToManyRelation.foreignKey;
      const relatedModelColumns = getModelColumns(relation.model).map(
        (column2) => column2.columnName
      );
      return {
        query: generateManyToManyQuery({
          dbType,
          relationName,
          leftTablePrimaryColumn: convertCase(
            primaryKey,
            typeofModel.databaseCaseConvention
          ),
          rightTablePrimaryColumn: convertCase(
            relatedModelPrimaryKey,
            typeofModel.databaseCaseConvention
          ),
          pivotLeftTableColumn: convertCase(
            throughModelPrimaryKey,
            typeofModel.databaseCaseConvention
          ),
          pivotRightTableColumn: convertCase(
            relatedModelForeignKey,
            typeofModel.databaseCaseConvention
          ),
          selectedColumns: relationQuery.selectedColumns?.length ? relationQuery.selectedColumns : relatedModelColumns.map(
            (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
          ),
          relatedModelColumns: relatedModelColumns.map(
            (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
          ),
          leftTable: typeofModel.tableName,
          rightTable: relatedModelTable,
          pivotTable: throughModel,
          whereCondition: whereQuery,
          orderBy: orderByQuery,
          havingQuery,
          limit: extractedLimitValue ? +extractedLimitValue : void 0,
          offset: +extractedOffsetValue || 0
        }),
        params
      };
    default:
      throw new Error(`Unknown relation type: ${relation.type}`);
  }
}
var RELATION_default = relationTemplates;

// src/sql/resources/query/UPDATE.ts
var updateTemplate = (dbType, typeofModel) => {
  const table = typeofModel.table;
  const modelColumns = getModelColumns(typeofModel);
  return {
    update: (columns, values, primaryKey, primaryKeyValue) => {
      if (columns.includes("$additionalColumns")) {
        const $additionalColumnsIndex = columns.indexOf("$additionalColumns");
        columns.splice(columns.indexOf("$additionalColumns"), 1);
        values.splice($additionalColumnsIndex, 1);
      }
      for (let i = 0; i < values.length; i++) {
        const column2 = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn2) => modelColumn2.columnName === column2
        );
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }
      values = values.map((value) => {
        if (isNestedObject(value)) {
          return JSON.stringify(value);
        }
        return value;
      });
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
      if (columns.includes("$additionalColumns")) {
        const $additionalColumnsIndex = columns.indexOf("$additionalColumns");
        columns.splice(columns.indexOf("$additionalColumns"), 1);
        values.splice($additionalColumnsIndex, 1);
      }
      for (let i = 0; i < values.length; i++) {
        const column2 = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn2) => modelColumn2.columnName === column2
        );
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }
      let setClause;
      const params = [];
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns.map((column2) => `\`${column2}\` = ?`).join(", ");
          values.forEach((value) => {
            if (isNestedObject(value)) {
              params.push(JSON.stringify(value));
              return;
            }
            params.push(value ?? null);
          });
          break;
        case "postgres":
          setClause = columns.map((column2, index) => `"${column2}" = $${index + 1}`).join(", ");
          values.forEach((value) => {
            if (isNestedObject(value)) {
              params.push(JSON.stringify(value));
              return;
            }
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
    const relation = relations.find(
      (relation2) => relation2.columnName === relationField
    );
    if (!relation) {
      throw new Error(
        `Relation ${relationField} not found in model ${typeofModel}`
      );
    }
    return relation;
  }
  async parseQueryBuilderRelations(models, typeofModel, input, dbType, logs) {
    if (!input.length) {
      return [];
    }
    if (!typeofModel.primaryKey) {
      throw new Error(`Model ${typeofModel} does not have a primary key`);
    }
    const resultMap = {};
    for (const inputRelation of input) {
      const relation = this.getRelationFromModel(
        inputRelation.relation,
        typeofModel
      );
      const { query, params } = RELATION_default(
        models,
        relation,
        inputRelation.relation,
        inputRelation,
        typeofModel,
        dbType
      );
      if (!query) {
        resultMap[inputRelation.relation] = [];
        continue;
      }
      log(query, logs, params);
      let result = await this.getQueryResult(query, params);
      if (!result) {
        result = [];
      } else if (!Array.isArray(result)) {
        result = [result];
      }
      for (const row of result) {
        if (inputRelation.dynamicColumns?.length) {
          await relation.model.addDynamicColumns(
            row[row["relation_name"]],
            inputRelation.dynamicColumns
          );
        }
      }
      if (!inputRelation.ignoreAfterFetchHook) {
        result = await relation.model.afterFetch(result);
      }
      result.forEach((row) => {
        const relationName = row.relation_name;
        delete row.relation_name;
        if (!resultMap[relationName]) {
          resultMap[relationName] = [];
        }
        resultMap[relationName].push(row);
      });
    }
    const resultArray = input.map(
      (inputRelation) => {
        const modelsForRelation = resultMap[inputRelation.relation] || [];
        modelsForRelation.forEach((model) => {
          if (typeof model[inputRelation.relation] === "string") {
            model[inputRelation.relation] = JSON.parse(
              model[inputRelation.relation]
            );
          }
        });
        return {
          [inputRelation.relation]: modelsForRelation
        };
      }
    );
    return resultArray;
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
var baseSelectMethods = [
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
        if (baseSelectMethods.includes(columnName.toUpperCase()) || columnName.includes("(")) {
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
    distinct: `DISTINCT`,
    distinctOn: (...columns) => {
      if (dbType !== "postgres") {
        throw new Error("DISTINCT ON is only supported in postgres");
      }
      columns = columns.map(
        (column2) => escapeIdentifier(
          convertCase(column2, typeofModel.databaseCaseConvention)
        )
      );
      return `DISTINCT ON (${columns.join(", ")})`;
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
    _orderBy: (columns, order = "ASC") => {
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
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) ${operator} PLACEHOLDER`;
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
    rawWhere: (query, params) => ({
      query: `
WHERE ${query}`,
      params
    }),
    rawAndWhere: (query, params) => ({
      query: ` AND ${query}`,
      params
    }),
    rawOrWhere: (query, params) => ({
      query: ` OR ${query}`,
      params
    }),
    whereRegex: (column2, regex) => {
      switch (dbType) {
        case "postgres":
          return {
            query: `
WHERE ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} ~ PLACEHOLDER`,
            params: [regex.source]
          };
        case "mysql":
        case "mariadb":
          return {
            query: `
WHERE ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} REGEXP PLACEHOLDER`,
            params: [regex.source]
          };
        case "sqlite":
          throw new Error("SQLite does not support REGEXP out of the box");
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    },
    andWhereRegex: (column2, regex) => {
      switch (dbType) {
        case "postgres":
          return {
            query: ` AND ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} ~ PLACEHOLDER`,
            params: [regex.source]
          };
        case "mysql":
        case "mariadb":
          return {
            query: ` AND ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} REGEXP PLACEHOLDER`,
            params: [regex.source]
          };
        case "sqlite":
          throw new Error("SQLite does not support REGEXP out of the box");
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    },
    orWhereRegex: (column2, regex) => {
      switch (dbType) {
        case "postgres":
          return {
            query: ` OR ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} ~ PLACEHOLDER`,
            params: [regex.source]
          };
        case "mysql":
        case "mariadb":
          return {
            query: ` OR ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} REGEXP PLACEHOLDER`,
            params: [regex.source]
          };
        case "sqlite":
          throw new Error("SQLite does not support REGEXP out of the box");
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    }
  };
};
var WHERE_default = whereTemplate;

// src/sql/query_builder/where_query_builder.ts
var WhereQueryBuilder = class {
  /**
   * @description Constructs a query_builder instance.
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
   * @description Accepts a value and executes a callback only of the value is not null or undefined.
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
    if (!this.whereQuery && !this.isNestedCondition) {
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
  whereRegexp(column2, regexp) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereRegex(
        column2,
        regexp
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereRegex(
      column2,
      regexp
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereRegexp(column2, regexp) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereRegex(
        column2,
        regexp
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereRegex(
      column2,
      regexp
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereRegexp(column2, regexp) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereRegex(
        column2,
        regexp
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereRegex(
      column2,
      regexp
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  /**
   * @description Adds a raw WHERE condition to the query.
   */
  rawWhere(query, queryParams = []) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(
        query,
        queryParams
      );
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(
      query,
      queryParams
    );
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  /**
   * @description Adds a raw AND WHERE condition to the query.
   */
  rawAndWhere(query, queryParams = []) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(
        query,
        queryParams
      );
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(
      query,
      queryParams
    );
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  /**
   * @description Adds a raw OR WHERE condition to the query.
   */
  rawOrWhere(query, queryParams = []) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(
        query,
        queryParams
      );
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(
      query,
      queryParams
    );
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
};

// src/sql/query_builder/query_builder.ts
var QueryBuilder = class extends WhereQueryBuilder {
  /**
   * @description Constructs a Mysql_query_builder instance.
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
    this.whereQuery = "";
    this.modelSelectedColumns = [];
    this.relations = [];
    this.dynamicColumns = [];
    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
    this.havingQuery = "";
  }
  /**
   * @description Executes the query and retrieves the first result.
   * @alias one
   */
  async first(options) {
    return this.one(options);
  }
  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   * @alias oneOrFail
   */
  async firstOrFail(options) {
    return this.oneOrFail(options);
  }
  /**
   * @description Returns the query and the parameters in an object.
   */
  toSql() {
    const query = this.selectQuery + this.joinQuery + this.whereQuery + this.groupByQuery + this.havingQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
    function parsePlaceHolders(dbType, query2, startIndex = 1) {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query2.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
          let index = startIndex;
          return query2.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new Error(
            "Unsupported database type, did you forget to set the dbType in the function params?"
          );
      }
    }
    const parsedQuery = parsePlaceHolders(
      this.sqlDataSource.getDbType(),
      query
    );
    return { query: parsedQuery, params: this.params };
  }
  groupFooterQuery() {
    return this.groupByQuery + this.havingQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
  }
  async mergeRawPacketIntoModel(model, row, typeofModel) {
    const columns = getModelColumns(this.model);
    Object.entries(row).forEach(([key, value]) => {
      const casedKey = convertCase(
        key,
        typeofModel.modelCaseConvention
      );
      if (columns.map((column2) => column2.columnName).includes(casedKey)) {
        Object.assign(model, { [casedKey]: value });
        return;
      }
      model.$additionalColumns[key] = value;
    });
    if (!this.dynamicColumns.length) {
      return;
    }
    await addDynamicColumnsToModel(this.model, model, this.dynamicColumns);
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

// src/sql/mysql/mysql_query_builder.ts
var MysqlQueryBuilder = class _MysqlQueryBuilder extends QueryBuilder {
  constructor(type, model, table, mysqlConnection, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, sqlDataSource);
    this.type = type;
    this.mysqlConnection = mysqlConnection;
    this.updateTemplate = UPDATE_default(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = DELETE_default(table, sqlDataSource.getDbType());
    this.isNestedCondition = isNestedCondition;
    this.mysqlModelManagerUtils = new SqlModelManagerUtils(
      this.type,
      this.mysqlConnection
    );
  }
  async one(options = {}) {
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
    const [rows] = await this.mysqlConnection.query(query, this.params);
    if (!rows.length) {
      return null;
    }
    const modelInstance = getBaseModelInstance();
    await this.mergeRawPacketIntoModel(modelInstance, rows[0], this.model);
    const relationModels = await this.mysqlModelManagerUtils.parseQueryBuilderRelations(
      [modelInstance],
      this.model,
      this.relations,
      this.type,
      this.logs
    );
    const model = await parseDatabaseDataIntoModelResponse(
      [modelInstance],
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    return !options.ignoreHooks?.includes("afterFetch") ? (await this.model.afterFetch([model]))[0] : model;
  }
  async oneOrFail(options) {
    const model = await this.one({
      ignoreHooks: options?.ignoreHooks
    });
    if (!model) {
      if (options?.customError) {
        throw options.customError;
      }
      throw new Error("ROW_NOT_FOUND");
    }
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
    const [rows] = await this.mysqlConnection.query(query, this.params);
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
      this.type,
      this.logs
    );
    const serializedModels = await parseDatabaseDataIntoModelResponse(
      models,
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    if (!serializedModels) {
      return [];
    }
    if (!options.ignoreHooks?.includes("afterFetch")) {
      await this.model.afterFetch(
        Array.isArray(serializedModels) ? serializedModels : [serializedModels]
      );
    }
    return Array.isArray(serializedModels) ? serializedModels : [serializedModels];
  }
  async softDelete(options) {
    const {
      column: column2 = "deletedAt",
      value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "),
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
    const rows = await this.mysqlConnection.query(query, params);
    if (!rows[0].affectedRows) {
      return 0;
    }
    return rows[0].affectedRows;
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
    const rows = await this.mysqlConnection.query(query, this.params);
    if (!rows[0].affectedRows) {
      return 0;
    }
    return rows[0].affectedRows;
  }
  async update(data, options) {
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
    console.log(query, params, this.params);
    params.push(...this.params);
    log(query, this.logs, params);
    const rows = await this.mysqlConnection.query(query, params);
    if (!rows[0].affectedRows) {
      return 0;
    }
    return rows[0].affectedRows;
  }
  whereBuilder(cb) {
    const queryBuilder = new _MysqlQueryBuilder(
      this.type,
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
      this.type,
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
      this.type,
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
  async getCount(options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const [result2] = await this.mysqlConnection.query(
        `SELECT COUNT(*) as total from ${this.table}`
      );
      return result2[0].total;
    }
    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.$additionalColumns.total : 0;
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
    return result ? +result.$additionalColumns.total : 0;
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
      +total[0].$additionalColumns["total"]
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
    this.modelSelectedColumns = columns.map(
      (column2) => convertCase(column2, this.model.databaseCaseConvention)
    );
    this.selectQuery = this.selectTemplate.selectColumns(
      ...columns
    );
    return this;
  }
  distinct() {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`
    );
    return this;
  }
  distinctOn(...columns) {
    throw new Error("DISTINCT ON is only supported in postgres");
  }
  joinRaw(query) {
    this.joinQuery += ` ${query} `;
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
  with(relation, relatedModel, relatedModelQueryBuilder, ignoreHooks) {
    if (!relatedModelQueryBuilder) {
      this.relations.push({
        relation
      });
      return this;
    }
    const queryBuilder = new _MysqlQueryBuilder(
      this.type,
      relatedModel,
      relatedModel?.table || "",
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
    relatedModelQueryBuilder(queryBuilder);
    if (!ignoreHooks?.beforeFetch) {
      relatedModel?.beforeFetch(queryBuilder);
    }
    this.relations.push({
      relation,
      selectedColumns: queryBuilder.modelSelectedColumns,
      whereQuery: this.whereTemplate.convertPlaceHolderToValue(
        queryBuilder.whereQuery
      ),
      params: queryBuilder.params,
      joinQuery: queryBuilder.joinQuery,
      groupByQuery: queryBuilder.groupByQuery,
      orderByQuery: queryBuilder.orderByQuery,
      limitQuery: queryBuilder.limitQuery,
      offsetQuery: queryBuilder.offsetQuery,
      havingQuery: queryBuilder.havingQuery,
      dynamicColumns: queryBuilder.dynamicColumns,
      ignoreAfterFetchHook: ignoreHooks?.afterFetch || false
    });
    return this;
  }
  addDynamicColumns(dynamicColumns) {
    this.dynamicColumns = dynamicColumns;
    return this;
  }
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  groupByRaw(query) {
    query.replace("GROUP BY", "");
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }
  orderBy(column2, order) {
    const casedColumn = convertCase(
      column2,
      this.model.databaseCaseConvention
    );
    if (this.orderByQuery) {
      this.orderByQuery += `, ${casedColumn} ${order}`;
      return this;
    }
    this.orderByQuery = ` ORDER BY ${casedColumn} ${order}`;
    return this;
  }
  orderByRaw(query) {
    if (this.orderByQuery) {
      this.orderByQuery += `, ${query}`;
      return this;
    }
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
  havingRaw(query) {
    query = query.replace("HAVING", "");
    if (this.havingQuery) {
      this.havingQuery += ` AND ${query}`;
      return this;
    }
    this.havingQuery = ` HAVING ${query}`;
    return this;
  }
  copy() {
    const queryBuilder = new _MysqlQueryBuilder(
      this.type,
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
  constructor(type, model, mysqlConnection, logs, sqlDataSource) {
    super(model, logs, sqlDataSource);
    this.type = type;
    this.mysqlConnection = mysqlConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils(
      this.type,
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
    if (!input) {
      return await this.query().many();
    }
    const query = this.query();
    if (input.select) {
      query.select(...input.select);
    }
    if (input.relations) {
      input.relations.forEach((relation) => {
        query.with(relation);
      });
    }
    if (input.where) {
      Object.entries(input.where).forEach(([key, value]) => {
        query.where(key, value);
      });
    }
    if (input.orderBy) {
      Object.entries(input.orderBy).forEach(([key, value]) => {
        query.orderBy(key, value);
      });
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
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    const results = await this.find({
      ...input,
      limit: 1
    });
    if (!results.length) {
      return null;
    }
    return results[0];
  }
  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneByPrimaryKey(value) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be retrieved by"
      );
    }
    return await this.query().where(this.model.primaryKey, value).one();
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
    log(query, this.logs, params);
    const [result] = await this.mysqlConnection.query(query, params);
    if (this.model.primaryKey && model[this.model.primaryKey]) {
      const pkValue = model[this.model.primaryKey];
      return await this.findOneByPrimaryKey(pkValue);
    }
    return await this.findOneByPrimaryKey(result["insertId"]);
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
    const updateQuery = this.sqlModelManagerUtils.parseUpdate(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(updateQuery.query, this.logs, updateQuery.params);
    await this.mysqlConnection.query(updateQuery.query, updateQuery.params);
    if (!this.model.primaryKey) {
      log("Model has no primary key so no record can be retrieved", this.logs);
      return null;
    }
    return await this.findOneByPrimaryKey(
      model[this.model.primaryKey]
    );
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {TransactionType} trx - TransactionType to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteRecord(model) {
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
    const [rows] = await this.mysqlConnection.query(query, params);
    if (this.sqlDataSource.getDbType() === "mariadb") {
      return await parseDatabaseDataIntoModelResponse(
        [rows[0]],
        this.model
      );
    }
    return model;
  }
  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   *
   * @returns {Mysql_query_builder<Model>} - Instance of Mysql_query_builder.
   */
  query() {
    return new MysqlQueryBuilder(
      this.type,
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
import "reflect-metadata";
var PostgresQueryBuilder = class _PostgresQueryBuilder extends QueryBuilder {
  constructor(model, table, pgClient, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, sqlDataSource);
    this.pgClient = pgClient;
    this.isNestedCondition = isNestedCondition;
    this.updateTemplate = UPDATE_default(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = DELETE_default(table, sqlDataSource.getDbType());
    this.postgresModelManagerUtils = new SqlModelManagerUtils(
      "postgres",
      this.pgClient
    );
  }
  select(...columns) {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...columns
    );
    this.modelSelectedColumns = columns.map(
      (column2) => convertCase(column2, this.model.databaseCaseConvention)
    );
    return this;
  }
  distinct() {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`
    );
    return this;
  }
  distinctOn(...columns) {
    const distinctOn = this.selectTemplate.distinctOn(...columns);
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinctOn}`
    );
    return this;
  }
  async one(options = {}) {
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
    const result = await this.pgClient.query(query, this.params);
    if (!result.rows[0]) {
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
      "postgres",
      this.logs
    );
    const model = await parseDatabaseDataIntoModelResponse(
      [modelInstance],
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    return !options.ignoreHooks?.includes("afterFetch") ? (await this.model.afterFetch([model]))[0] : model;
  }
  async oneOrFail(options) {
    const model = await this.one({
      ignoreHooks: options?.ignoreHooks
    });
    if (!model) {
      if (options?.customError) {
        throw options.customError;
      }
      throw new Error("ROW_NOT_FOUND");
    }
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
      "postgres",
      this.logs
    );
    const serializedModels = await parseDatabaseDataIntoModelResponse(
      models,
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    if (!serializedModels) {
      return [];
    }
    if (!options.ignoreHooks?.includes("afterFetch")) {
      await this.model.afterFetch(
        Array.isArray(serializedModels) ? serializedModels : [serializedModels]
      );
    }
    return Array.isArray(serializedModels) ? serializedModels : [serializedModels];
  }
  async update(data, options) {
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
    const result = await this.pgClient.query(query, params);
    if (!result.rows) {
      return 0;
    }
    return result.rowCount || 0;
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
    const result = await this.pgClient.query(query, this.params);
    if (!result.rows) {
      return 0;
    }
    return result.rowCount || 0;
  }
  async softDelete(options) {
    const {
      column: column2 = "deletedAt",
      value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "),
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
    const result = await this.pgClient.query(query, params);
    if (!result.rows) {
      return 0;
    }
    return result.rowCount || 0;
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
  async getCount(options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const { rows } = await this.pgClient.query(
        `SELECT COUNT(*) as total from ${this.table}`
      );
      return +rows[0].total;
    }
    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.$additionalColumns["total"] : 0;
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
    return result ? +result.$additionalColumns["total"] : 0;
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
      +total[0].$additionalColumns["total"]
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
  joinRaw(query) {
    this.joinQuery += ` ${query} `;
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
  with(relation, relatedModel, relatedModelQueryBuilder, ignoreHooks) {
    if (!relatedModelQueryBuilder) {
      this.relations.push({
        relation
      });
      return this;
    }
    const queryBuilder = new _PostgresQueryBuilder(
      relatedModel,
      relatedModel?.table || "",
      this.pgClient,
      this.logs,
      false,
      this.sqlDataSource
    );
    relatedModelQueryBuilder(queryBuilder);
    if (!ignoreHooks?.beforeFetch) {
      relatedModel?.beforeFetch(queryBuilder);
    }
    this.relations.push({
      relation,
      selectedColumns: queryBuilder.modelSelectedColumns,
      whereQuery: this.whereTemplate.convertPlaceHolderToValue(
        queryBuilder.whereQuery
      ),
      params: queryBuilder.params,
      joinQuery: queryBuilder.joinQuery,
      groupByQuery: queryBuilder.groupByQuery,
      orderByQuery: queryBuilder.orderByQuery,
      limitQuery: queryBuilder.limitQuery,
      offsetQuery: queryBuilder.offsetQuery,
      havingQuery: queryBuilder.havingQuery,
      dynamicColumns: queryBuilder.dynamicColumns,
      ignoreAfterFetchHook: ignoreHooks?.afterFetch || false
    });
    return this;
  }
  addDynamicColumns(dynamicColumns) {
    this.dynamicColumns = dynamicColumns;
    return this;
  }
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  groupByRaw(query) {
    query.replace("GROUP BY", "");
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }
  orderBy(column2, order) {
    const casedColumn = convertCase(
      column2,
      this.model.databaseCaseConvention
    );
    if (this.orderByQuery) {
      this.orderByQuery += `, ${casedColumn} ${order}`;
      return this;
    }
    this.orderByQuery = ` ORDER BY ${casedColumn} ${order}`;
    return this;
  }
  orderByRaw(query) {
    if (this.orderByQuery) {
      this.orderByQuery += `, ${query}`;
      return this;
    }
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
  havingRaw(query) {
    query = query.replace("HAVING", "");
    if (this.havingQuery) {
      this.havingQuery += ` AND ${query}`;
      return this;
    }
    this.havingQuery = ` HAVING ${query}`;
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
    if (!input) {
      return await this.query().many();
    }
    const query = this.query();
    if (input.select) {
      query.select(...input.select);
    }
    if (input.relations) {
      input.relations.forEach((relation) => {
        query.with(relation);
      });
    }
    if (input.where) {
      Object.entries(input.where).forEach(([key, value]) => {
        query.where(key, value);
      });
    }
    if (input.orderBy) {
      Object.entries(input.orderBy).forEach(([key, value]) => {
        query.orderBy(key, value);
      });
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
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    const results = await this.find({
      ...input,
      limit: 1
    });
    if (!results.length) {
      return null;
    }
    return results[0];
  }
  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK value of the record to retrieve.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneByPrimaryKey(value) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be retrieved by"
      );
    }
    return await this.query().where(this.model.primaryKey, "=", value).one();
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
    log(query, this.logs, params);
    const { rows } = await this.pgConnection.query(query, params);
    const insertedModel = rows[0];
    if (!insertedModel) {
      throw new Error(rows[0]);
    }
    const result = await parseDatabaseDataIntoModelResponse(
      [insertedModel],
      this.model
    );
    this.model.afterFetch([result]);
    return result;
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
    log(query, this.logs, params);
    const { rows } = await this.pgConnection.query(query, params);
    const insertedModel = rows;
    if (!insertedModel.length) {
      return [];
    }
    const insertModelPromise = insertedModel.map(
      async (model) => await parseDatabaseDataIntoModelResponse([model], this.model)
    );
    const results = await Promise.all(insertModelPromise);
    this.model.afterFetch(results);
    return results;
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
    log(query, this.logs, params);
    await this.pgConnection.query(query, params);
    if (!primaryKey) {
      return null;
    }
    return await this.findOneByPrimaryKey(
      model[primaryKey]
    );
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {Transaction} trx - Transaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteRecord(model) {
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
};

// src/sql/sqlite/sql_lite_query_builder.ts
var SqlLiteQueryBuilder = class _SqlLiteQueryBuilder extends QueryBuilder {
  constructor(model, table, sqLiteConnection, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, sqlDataSource);
    this.sqLiteConnection = sqLiteConnection;
    this.isNestedCondition = isNestedCondition;
    this.updateTemplate = UPDATE_default(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = DELETE_default(table, sqlDataSource.getDbType());
    this.sqliteModelManagerUtils = new SqlModelManagerUtils(
      "sqlite",
      this.sqLiteConnection
    );
  }
  async one(options = {}) {
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
    const results = await this.promisifyQuery(query, this.params);
    if (!results.length) {
      return null;
    }
    const result = results[0];
    const modelInstance = getBaseModelInstance();
    await this.mergeRawPacketIntoModel(modelInstance, result, this.model);
    const relationModels = await this.sqliteModelManagerUtils.parseQueryBuilderRelations(
      [modelInstance],
      this.model,
      this.relations,
      "sqlite",
      this.logs
    );
    const model = await parseDatabaseDataIntoModelResponse(
      [modelInstance],
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    return !options.ignoreHooks?.includes("afterFetch") ? (await this.model.afterFetch([model]))[0] : model;
  }
  async oneOrFail(options) {
    const model = await this.one({
      ignoreHooks: options?.ignoreHooks
    });
    if (!model) {
      if (options?.customError) {
        throw options.customError;
      }
      throw new Error("ROW_NOT_FOUND");
    }
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
      "sqlite",
      this.logs
    );
    const serializedModels = await parseDatabaseDataIntoModelResponse(
      models,
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    if (!serializedModels) {
      return [];
    }
    if (!options.ignoreHooks?.includes("afterFetch")) {
      await this.model.afterFetch(
        Array.isArray(serializedModels) ? serializedModels : [serializedModels]
      );
    }
    return Array.isArray(serializedModels) ? serializedModels : [serializedModels];
  }
  async update(data, options) {
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
    return await new Promise((resolve, reject) => {
      this.sqLiteConnection.run(query, params, function(err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes);
        }
      });
    });
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
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.run(query, this.params, function(err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes);
        }
      });
    });
  }
  async softDelete(options) {
    const {
      column: column2 = "deletedAt",
      value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "),
      // TODO: check if this is the correct format
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
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.run(query, params, function(err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes);
        }
      });
    });
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
    return result ? +result.$additionalColumns.total : 0;
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
    return result ? +result.$additionalColumns.total : 0;
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
      +total[0].$additionalColumns["total"]
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
    this.modelSelectedColumns = columns.map(
      (column2) => convertCase(column2, this.model.databaseCaseConvention)
    );
    return this;
  }
  distinct() {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`
    );
    return this;
  }
  distinctOn(...columns) {
    throw new Error("DISTINCT ON is only supported in postgres");
  }
  joinRaw(query) {
    this.joinQuery += ` ${query} `;
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
  with(relation, relatedModel, relatedModelQueryBuilder, ignoreHooks) {
    if (!relatedModelQueryBuilder) {
      this.relations.push({
        relation
      });
      return this;
    }
    const queryBuilder = new _SqlLiteQueryBuilder(
      relatedModel,
      relatedModel?.table || "",
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
    relatedModelQueryBuilder(queryBuilder);
    if (!ignoreHooks?.beforeFetch) {
      relatedModel?.beforeFetch(queryBuilder);
    }
    this.relations.push({
      relation,
      selectedColumns: queryBuilder.modelSelectedColumns,
      whereQuery: this.whereTemplate.convertPlaceHolderToValue(
        queryBuilder.whereQuery
      ),
      params: queryBuilder.params,
      joinQuery: queryBuilder.joinQuery,
      groupByQuery: queryBuilder.groupByQuery,
      orderByQuery: queryBuilder.orderByQuery,
      limitQuery: queryBuilder.limitQuery,
      offsetQuery: queryBuilder.offsetQuery,
      havingQuery: queryBuilder.havingQuery,
      dynamicColumns: queryBuilder.dynamicColumns,
      ignoreAfterFetchHook: ignoreHooks?.afterFetch || false
    });
    return this;
  }
  addDynamicColumns(dynamicColumns) {
    this.dynamicColumns = dynamicColumns;
    return this;
  }
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  groupByRaw(query) {
    query.replace("GROUP BY", "");
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }
  orderBy(column2, order) {
    const casedColumn = convertCase(
      column2,
      this.model.databaseCaseConvention
    );
    if (this.orderByQuery) {
      this.orderByQuery += `, ${casedColumn} ${order}`;
      return this;
    }
    this.orderByQuery = ` ORDER BY ${casedColumn} ${order}`;
    return this;
  }
  orderByRaw(query) {
    if (this.orderByQuery) {
      this.orderByQuery += `, ${query}`;
      return this;
    }
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
  havingRaw(query) {
    query = query.replace("HAVING", "");
    if (this.havingQuery) {
      this.havingQuery += ` AND ${query}`;
      return this;
    }
    this.havingQuery = ` HAVING ${query}`;
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
    if (!input) {
      return await this.query().many();
    }
    const query = this.query();
    if (input.select) {
      query.select(...input.select);
    }
    if (input.relations) {
      input.relations.forEach((relation) => {
        query.with(relation);
      });
    }
    if (input.where) {
      Object.entries(input.where).forEach(([key, value]) => {
        query.where(key, value);
      });
    }
    if (input.orderBy) {
      Object.entries(input.orderBy).forEach(([key, value]) => {
        query.orderBy(key, value);
      });
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
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    const results = await this.find({
      ...input,
      limit: 1
    });
    if (!results.length) {
      return null;
    }
    return results[0];
  }
  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneByPrimaryKey(value) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be retrieved by"
      );
    }
    return await this.query().where(this.model.primaryKey, value).one();
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
    log(query, this.logs, params);
    return await this.promisifyQuery(query, params, {
      isCreate: true,
      models: model
    });
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
    log(query, this.logs, params);
    return await this.promisifyQuery(query, params, {
      isInsertMany: true,
      models
    });
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
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param trx - SqliteTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteRecord(model) {
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
      return new Promise(async (resolve, reject) => {
        for (const model of models) {
          try {
            const { query: query2, params: params2 } = this.sqlModelManagerUtils.parseInsert(
              model,
              this.model,
              this.sqlDataSource.getDbType()
            );
            await new Promise((resolve2, reject2) => {
              this.sqLiteConnection.run(query2, params2, function(err) {
                if (err) {
                  return reject2(err);
                }
                const lastID = model[primaryKeyName] || this.lastID;
                const selectQuery = `SELECT * FROM ${table} WHERE ${primaryKeyName} = ?`;
                sqLiteConnection.get(
                  selectQuery,
                  [lastID],
                  (err2, row) => {
                    if (err2) {
                      return reject2(err2);
                    }
                    finalResult.push(row);
                    resolve2();
                  }
                );
              });
            });
          } catch (err) {
            return reject(err);
          }
        }
        resolve(finalResult);
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

// src/sql/transactions/transaction.ts
var Transaction = class {
  constructor(sqlDataSource, logs) {
    this.sqlDataSource = sqlDataSource;
    this.sqlConnection = this.sqlDataSource.getCurrentConnection();
    this.isActive = false;
    this.logs = logs || this.sqlDataSource.logs || false;
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
          await this.sqlConnection.query(
            BEGIN_TRANSACTION
          );
          break;
        case "sqlite":
          log(BEGIN_TRANSACTION, this.logs);
          this.sqlConnection.run(
            BEGIN_TRANSACTION,
            (err) => {
              if (err) {
                throw new Error(err.message);
              }
            }
          );
          break;
        default:
          throw new Error("Invalid database type while beginning transaction");
      }
      this.isActive = true;
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
          await this.sqlConnection.query(
            COMMIT_TRANSACTION
          );
          break;
        case "sqlite":
          log(COMMIT_TRANSACTION, this.logs);
          this.sqlConnection.run(
            COMMIT_TRANSACTION,
            (err) => {
              if (err) {
                throw new Error(err.message);
              }
            }
          );
          break;
        default:
          throw new Error("Invalid database type while committing transaction");
      }
      this.isActive = false;
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
          await this.sqlConnection.query(
            ROLLBACK_TRANSACTION
          );
          break;
        case "sqlite":
          log(ROLLBACK_TRANSACTION, this.logs);
          this.sqlConnection.run(
            ROLLBACK_TRANSACTION,
            (err) => {
              if (err) {
                throw new Error(err.message);
              }
            }
          );
          break;
        default:
          throw new Error(
            "Invalid database type while rolling back transaction"
          );
      }
      this.isActive = false;
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
var _SqlDataSource = class _SqlDataSource extends DataSource {
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
    const driver = await DriverFactory.getDriver(sqlDataSource.type);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        const mysqlDriver = driver.client;
        sqlDataSource.sqlConnection = await mysqlDriver.createConnection({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
          ...input?.mysqlOptions
        });
        break;
      case "postgres":
        const pgDriver = driver.client;
        sqlDataSource.sqlConnection = new pgDriver.Client({
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
        const sqlite3 = driver.client;
        sqlDataSource.sqlConnection = new sqlite3.Database(
          sqlDataSource.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          }
        );
        break;
      default:
        throw new Error(`Unsupported data source type: ${sqlDataSource.type}`);
    }
    sqlDataSource.isConnected = true;
    _SqlDataSource.instance = sqlDataSource;
    cb?.();
    return sqlDataSource;
  }
  static getInstance() {
    if (!_SqlDataSource.instance) {
      throw new Error("sql database connection not established");
    }
    return _SqlDataSource.instance;
  }
  /**
   * @description Executes a callback function with the provided connection details using the main connection established with SqlDataSource.connect() method
   * @description The callback automatically commits or rollbacks the transaction based on the result of the callback
   * @description NOTE: trx must always be passed to single methods that are part of the transaction
   */
  static async useTransaction(cb, driverSpecificOptions) {
    const trx = await this.getInstance().startTransaction(
      driverSpecificOptions
    );
    try {
      await cb(trx).then(async () => {
        if (!trx.isActive) {
          return;
        }
        await trx.commit();
      });
    } catch (error) {
      if (!trx.isActive) {
        return;
      }
      await trx.rollback();
      throw error;
    }
  }
  /**
   * @description Executes a callback function with the provided connection details
   * @description The callback automatically commits or rollbacks the transaction based on the result of the callback
   * @description NOTE: trx must always be passed to single methods that are part of the transaction
   */
  async useTransaction(cb, driverSpecificOptions) {
    const trx = await this.startTransaction(driverSpecificOptions);
    try {
      await cb(trx).then(async () => {
        if (!trx.isActive) {
          return;
        }
        await trx.commit();
      });
    } catch (error) {
      if (!trx.isActive) {
        return;
      }
      await trx.rollback();
      throw error;
    }
  }
  /**
   * @description Starts a transaction on the database and returns the transaction object
   * @description This creates a new connection to the database, you can customize the connection details using the driverSpecificOptions
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
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  async beginTransaction(driverSpecificOptions) {
    return this.startTransaction(driverSpecificOptions);
  }
  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  async transaction(driverSpecificOptions) {
    return this.startTransaction(driverSpecificOptions);
  }
  /**
   * @description Returns model manager for the provided model
   */
  getModelManager(model) {
    if (!this.isConnected) {
      throw new Error("sql database connection not established");
    }
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return new MysqlModelManager(
          this.type,
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
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
  /**
   * @description Executes a callback function with the provided connection details
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
   * @description Returns the current connection {Promise<SqlConnectionType>} sqlConnection
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
        const mysqlDriver = (await DriverFactory.getDriver("mysql")).client;
        return await mysqlDriver.createConnection({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.mysqlOptions
        });
      case "postgres":
        const pg = (await DriverFactory.getDriver("postgres")).client;
        const client = new pg.Client({
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
        const sqlite3 = (await DriverFactory.getDriver("sqlite")).client;
        return new sqlite3.Database(
          this.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          }
        );
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
  /**
   * @description Closes the connection to the database
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
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
  /**
   * @description Closes the main connection to the database established with SqlDataSource.connect() method
   */
  static async closeConnection() {
    const sqlDataSource = _SqlDataSource.getInstance();
    if (!sqlDataSource.isConnected) {
      logger_default.warn("Connection already closed", sqlDataSource);
      return;
    }
    logger_default.warn("Closing connection", sqlDataSource);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        await sqlDataSource.sqlConnection.end();
        sqlDataSource.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      case "postgres":
        await sqlDataSource.sqlConnection.end();
        sqlDataSource.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      case "sqlite":
        await new Promise((resolve, reject) => {
          sqlDataSource.sqlConnection.close(
            (err) => {
              if (err) {
                reject(err);
              }
              resolve();
            }
          );
        });
        sqlDataSource.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      default:
        throw new Error(`Unsupported data source type: ${sqlDataSource.type}`);
    }
  }
  /**
   * @description Disconnects the connection to the database
   * @alias closeConnection
   */
  async disconnect() {
    return this.closeConnection();
  }
  /**
   * @description Disconnects the main connection to the database established with SqlDataSource.connect() method
   * @alias closeMainConnection
   */
  static async disconnect() {
    return _SqlDataSource.closeConnection();
  }
  /**
   * @description Executes a raw query on the database
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
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
  /**
   * @description Executes a raw query on the database with the base connection created with SqlDataSource.connect() method
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
        const { rows } = await sqlDataSource.sqlConnection.query(query, params);
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
        throw new Error(`Unsupported data source type: ${sqlDataSource.type}`);
    }
  }
  async connectDriver(driverSpecificOptions) {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        const mysql = (await DriverFactory.getDriver("mysql")).client;
        this.sqlConnection = await mysql.createConnection({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.mysqlOptions
        });
        break;
      case "postgres":
        const pg = (await DriverFactory.getDriver("postgres")).client;
        this.sqlConnection = new pg.Client({
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
        const sqlite3 = (await DriverFactory.getDriver("sqlite")).client;
        this.sqlConnection = new sqlite3.Database(
          this.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          }
        );
        break;
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
};
_SqlDataSource.instance = null;
var SqlDataSource = _SqlDataSource;

// src/hysteria_cli/migration_utils.ts
import fs2 from "fs";
import path2 from "path";
import dotenv3 from "dotenv";
dotenv3.config();
async function getMigrationTable(sqlConnection) {
  switch (process.env.DB_TYPE) {
    case "mariadb":
    case "mysql":
      const mysqlConnection = sqlConnection;
      await mysqlConnection.query(
        migration_templates_default.migrationTableTemplateMysql()
      );
      const result = await mysqlConnection.query(
        migration_templates_default.selectAllFromMigrationsTemplate()
      );
      return result[0];
    case "postgres":
      const pgConnection = sqlConnection;
      await pgConnection.query(migration_templates_default.migrationTableTemplatePg());
      const pgResult = await pgConnection.query(
        migration_templates_default.selectAllFromMigrationsTemplate()
      );
      return pgResult.rows;
    case "sqlite":
      await promisifySqliteQuery(
        migration_templates_default.migrationTableTemplateSQLite(),
        [],
        sqlConnection
      );
      const resultSqlite = await promisifySqliteQuery(
        migration_templates_default.selectAllFromMigrationsTemplate(),
        [],
        sqlConnection
      ) || [];
      return Array.isArray(resultSqlite) ? resultSqlite : [resultSqlite];
    default:
      throw new Error("Unsupported database type");
  }
}
async function getMigrations() {
  const migrationNames = findMigrationNames();
  const migrations = [];
  for (const migrationName of migrationNames) {
    const migrationModule = await findMigrationModule(migrationName);
    const migration = new migrationModule();
    migration.migrationName = migrationName;
    migrations.push(migration);
  }
  return migrations;
}
async function loadMigrationModule(absolutePath) {
  const isJs = path2.extname(absolutePath) === ".js";
  if (isJs) {
    const migrationModule2 = await import(absolutePath);
    return migrationModule2.default;
  }
  const tsNode = __require("ts-node");
  tsNode.register({
    transpileOnly: true
  });
  const migrationModule = __require(absolutePath);
  return migrationModule.default;
}
async function findMigrationModule(migrationName, migrationModulePath = process.env.MIGRATION_PATH ? process.env.MIGRATION_PATH + "/" + migrationName : "database/migrations/" + migrationName) {
  const migrationPath = process.cwd() + "/" + migrationModulePath;
  const migrationModule = await loadMigrationModule(migrationPath);
  if (!migrationModule) {
    throw new Error(
      "migrations module not found for migration: " + migrationName
    );
  }
  return migrationModule;
}
function findMigrationNames() {
  const currentUserDirectory = process.cwd();
  const migrationPath = path2.resolve(
    process.env.MIGRATION_PATH || "database/migrations"
  );
  const fullPathToMigrationPath = path2.resolve(
    currentUserDirectory,
    migrationPath
  );
  try {
    const migrationFiles = fs2.readdirSync(fullPathToMigrationPath);
    if (migrationFiles.length > 0) {
      return migrationFiles;
    }
    throw new Error(
      "No database migration files found on path: " + fullPathToMigrationPath
    );
  } catch (error) {
    throw new Error(
      "No database migration files found on path: " + fullPathToMigrationPath
    );
  }
}
async function promisifySqliteQuery(query, params, sqLiteConnection) {
  return new Promise((resolve, reject) => {
    sqLiteConnection.get(query, params, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

// src/hysteria_cli/postgres/run_migration.ts
dotenv4.config();
async function runMigrationsPg(runUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.query(BEGIN_TRANSACTION);
    const migrationTable = await getMigrationTable(sqlConnection);
    const migrations = await getMigrations();
    const pendingMigrations = migrations.filter(
      (migration) => !migrationTable.map((table) => table.name).includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (runUntil) {
      const runUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === runUntil
      );
      if (runUntilIndex === -1) {
        throw new Error(`Migration ${runUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(0, runUntilIndex + 1);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "postgres"
      );
      await migrationController2.upMigrations(filteredMigrations);
      log(COMMIT_TRANSACTION, true);
      await sqlConnection.query(COMMIT_TRANSACTION);
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "postgres"
    );
    await migrationController.upMigrations(pendingMigrations);
    log(COMMIT_TRANSACTION, true);
    await sqlConnection.query(COMMIT_TRANSACTION);
  } catch (error) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.query(ROLLBACK_TRANSACTION);
    throw error;
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/mysql/run_migration.ts
import dotenv5 from "dotenv";
dotenv5.config();
async function runMigrationsSql(runUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.beginTransaction();
    const migrationTable = await getMigrationTable(
      sqlConnection
    );
    const migrations = await getMigrations();
    const pendingMigrations = migrations.filter(
      (migration) => !migrationTable.map((table) => table.name).includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (runUntil) {
      const runUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === runUntil
      );
      if (runUntilIndex === -1) {
        throw new Error(`Migration ${runUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(0, runUntilIndex + 1);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "mysql"
      );
      await migrationController2.upMigrations(filteredMigrations);
      log(COMMIT_TRANSACTION, true);
      await sqlConnection.commit();
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "mysql"
    );
    await migrationController.upMigrations(pendingMigrations);
    log(COMMIT_TRANSACTION, true);
    await sqlConnection.commit();
  } catch (error) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.rollback();
    throw error;
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/sqlite/run_migration.ts
import dotenv6 from "dotenv";
dotenv6.config();
async function runMigrationsSQLite(runUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    const migrationTable = await getMigrationTable(sqlConnection) || [];
    const migrations = await getMigrations();
    const pendingMigrations = migrations.filter(
      (migration) => !migrationTable.map((table) => table.name).includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (runUntil) {
      const runUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === runUntil
      );
      if (runUntilIndex === -1) {
        throw new Error(`Migration ${runUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(0, runUntilIndex + 1);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "sqlite"
      );
      await migrationController2.upMigrations(filteredMigrations);
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "sqlite"
    );
    await migrationController.upMigrations(pendingMigrations);
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/migration_run_connector.ts
dotenv7.config();
async function runMigrationsConnector(runUntil) {
  const databaseType = process.env.DB_TYPE;
  if (!databaseType) {
    throw new Error("Run migrations error: DB_TYPE env not set");
  }
  logger_default.info(`Running migrations for ${databaseType}`);
  switch (databaseType) {
    case "mariadb":
    case "mysql":
      await runMigrationsSql(runUntil);
      break;
    case "postgres":
      await runMigrationsPg(runUntil);
      break;
    case "sqlite":
      await runMigrationsSQLite(runUntil);
      break;
    default:
      throw new Error(
        "Invalid database type, must be mysql, postgres or sqlite, got: " + databaseType
      );
  }
  logger_default.info("Migrations ran successfully");
}

// src/hysteria_cli/migration_rollback_connector.ts
import dotenv11 from "dotenv";

// src/hysteria_cli/mysql/rollback_migration.ts
import dotenv8 from "dotenv";
dotenv8.config();
async function migrationRollBackSql(rollBackUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.beginTransaction();
    const migrationTable = await getMigrationTable(sqlConnection);
    const migrations = await getMigrations();
    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter(
      (migration) => tableMigrations.includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil
      );
      if (rollBackUntilIndex === -1) {
        throw new Error(`Migration ${rollBackUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "mysql"
      );
      await migrationController2.downMigrations(filteredMigrations);
      log(COMMIT_TRANSACTION, true);
      await sqlConnection.commit();
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "mysql"
    );
    await migrationController.downMigrations(pendingMigrations);
    log(COMMIT_TRANSACTION, true);
    await sqlConnection.commit();
  } catch (error) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.rollback();
    throw error;
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/postgres/rollback_migration.ts
import dotenv9 from "dotenv";
dotenv9.config();
async function migrationRollBackPg(rollBackUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    const migrationTable = await getMigrationTable(sqlConnection);
    const migrations = await getMigrations();
    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter(
      (migration) => tableMigrations.includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil
      );
      if (rollBackUntilIndex === -1) {
        throw new Error(`Migration ${rollBackUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "postgres"
      );
      log(BEGIN_TRANSACTION, true);
      await sqlConnection.query(BEGIN_TRANSACTION);
      await migrationController2.downMigrations(filteredMigrations);
      await sqlConnection.query(COMMIT_TRANSACTION);
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "postgres"
    );
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.query(BEGIN_TRANSACTION);
    await migrationController.downMigrations(pendingMigrations);
    log(COMMIT_TRANSACTION, true);
    await sqlConnection.query(COMMIT_TRANSACTION);
  } catch (error) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.query(ROLLBACK_TRANSACTION);
    throw error;
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/sqlite/rollback_migration.ts
import dotenv10 from "dotenv";
dotenv10.config();
async function migrationRollBackSqlite(rollBackUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    const migrationTable = await getMigrationTable(sqlConnection) || [];
    const migrations = await getMigrations();
    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter(
      (migration) => tableMigrations.includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil
      );
      if (rollBackUntilIndex === -1) {
        throw new Error(`Migration ${rollBackUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "sqlite"
      );
      await migrationController2.downMigrations(filteredMigrations);
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "sqlite"
    );
    await migrationController.downMigrations(pendingMigrations);
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/migration_rollback_connector.ts
dotenv11.config();
async function rollbackMigrationConnector(rollBackUntil) {
  const databaseType = process.env.DB_TYPE;
  logger_default.info("Rolling back migrations for database type: " + databaseType);
  switch (databaseType) {
    case "mariadb":
    case "mysql":
      await migrationRollBackSql(rollBackUntil);
      break;
    case "postgres":
      await migrationRollBackPg(rollBackUntil);
      break;
    case "sqlite":
      await migrationRollBackSqlite(rollBackUntil);
      break;
    default:
      throw new Error(
        "Invalid database type, must be mysql or mysql, postgres, mariadb, sqlite, got: " + databaseType
      );
  }
}

// src/cli.ts
var program = new Command();
program.command("create:migration <name>").description(
  "Create a new migration file, standard folder is database/migrations from the current directory you are now, you can change it in the env MIGRATION_PATH"
).option(
  "-j, --javascript",
  "Generate a javascript file instead of a default typescript one",
  false
).action((name, option) => {
  if (!name) {
    console.error("Error: migrations name is required.");
    process.exit(1);
  }
  migrationCreateConnector(name, option.javascript);
});
program.command("run:migrations [runUntil]").description(
  "Run pending migrations, if runUntil is provided, it will run all migrations until the provided migration name"
).action(async (runUntil) => {
  await runMigrationsConnector(runUntil);
});
program.command("rollback:migrations [rollbackUntil]").description(
  "Rollbacks every migration that has been run, if rollbackUntil is provided, it will rollback all migrations until the provided migration name"
).action(async (rollbackUntil) => {
  await rollbackMigrationConnector(rollbackUntil);
});
program.command("refresh:migrations").description(
  "Rollbacks every migration that has been run and then run the migrations"
).action(async () => {
  await rollbackMigrationConnector();
  await runMigrationsConnector();
});
program.parse(process.argv);
//# sourceMappingURL=cli.mjs.map