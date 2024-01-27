var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports, module) {
    module.exports = {
      name: "dotenv",
      version: "16.3.1",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        "lint-readme": "standard-markdown",
        pretest: "npm run lint && npm run dts-check",
        test: "tap tests/*.js --100 -Rspec",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      funding: "https://github.com/motdotla/dotenv?sponsor=1",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@definitelytyped/dtslint": "^0.0.133",
        "@types/node": "^18.11.3",
        decache: "^4.6.1",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-markdown": "^7.1.0",
        "standard-version": "^9.5.0",
        tap: "^16.3.0",
        tar: "^6.1.11",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports, module) {
    "use strict";
    var fs = __require("fs");
    var path2 = __require("path");
    var os = __require("os");
    var crypto = __require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      const vaultPath = _vaultPath(options);
      const result = DotenvModule.configDotenv({ path: vaultPath });
      if (!result.parsed) {
        throw new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _log(message) {
      console.log(`[dotenv@${version}][INFO] ${message}`);
    }
    function _warn(message) {
      console.log(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          throw new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenv.org/vault/.env.vault?environment=development");
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        throw new Error("INVALID_DOTENV_KEY: Missing key part");
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        throw new Error("INVALID_DOTENV_KEY: Missing environment part");
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        throw new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let dotenvPath = path2.resolve(process.cwd(), ".env");
      if (options && options.path && options.path.length > 0) {
        dotenvPath = options.path;
      }
      return dotenvPath.endsWith(".vault") ? dotenvPath : `${dotenvPath}.vault`;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path2.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      _log("Loading env from encrypted .env.vault");
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      let dotenvPath = path2.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      if (options) {
        if (options.path != null) {
          dotenvPath = _resolveHome(options.path);
        }
        if (options.encoding != null) {
          encoding = options.encoding;
        }
      }
      try {
        const parsed = DotenvModule.parse(fs.readFileSync(dotenvPath, { encoding }));
        let processEnv = process.env;
        if (options && options.processEnv != null) {
          processEnv = options.processEnv;
        }
        DotenvModule.populate(processEnv, parsed, options);
        return { parsed };
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${dotenvPath} ${e.message}`);
        }
        return { error: e };
      }
    }
    function config(options) {
      const vaultPath = _vaultPath(options);
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      if (!fs.existsSync(vaultPath)) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.slice(0, 12);
      const authTag = ciphertext.slice(-16);
      ciphertext = ciphertext.slice(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const msg = "INVALID_DOTENV_KEY: It must be 64 characters long (or more)";
          throw new Error(msg);
        } else if (decryptionFailed) {
          const msg = "DECRYPTION_FAILED: Please check your DOTENV_KEY";
          throw new Error(msg);
        } else {
          console.error("Error: ", error.code);
          console.error("Error: ", error.message);
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        throw new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});

// src/Sql/Models/Relations/Relation.ts
var Relation = class {
  constructor(relatedModel) {
    __publicField(this, "foreignKey");
    __publicField(this, "relatedModel");
    this.relatedModel = relatedModel;
  }
};

// src/CaseUtils.ts
function camelToSnakeCase(camelCase) {
  if (typeof camelCase !== "string" || !camelCase) {
    return camelCase;
  }
  return camelCase.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
function fromSnakeToCamelCase(snake) {
  if (typeof snake !== "string" || !snake) {
    return snake;
  }
  return snake.replace(/(_\w)/g, (x) => x[1].toUpperCase());
}
function parseDatabaseDataIntoModelResponse(models, paginate) {
  if (!models) {
    return null;
  }
  if (paginate) {
    const offset = (paginate.page - 1) * paginate.limit;
    const paginatedItems = models.slice(offset, offset + paginate.limit);
    const paginationMetadata = {
      perPage: paginate.limit,
      currentPage: paginate.page,
      firstPage: 1,
      isEmpty: paginatedItems.length === 0,
      total: models.length,
      hasTotal: true,
      lastPage: Math.ceil(models.length / paginate.limit),
      hasMorePages: paginate.page < Math.ceil(models.length / paginate.limit),
      hasPages: models.length > paginate.limit
    };
    return {
      paginationMetadata,
      data: paginatedItems.map((model) => parseModel(model))
    };
  }
  const parsedModels = models.map((model) => parseModel(model));
  return parsedModels.length === 1 ? parsedModels[0] : parsedModels;
}
function parseModel(model) {
  const camelCaseModel = {};
  Object.keys(model).forEach((key) => {
    if (["metadata", "aliasColumns", "setProps"].includes(key)) {
      camelCaseModel[key] = model[key];
      return;
    }
    const originalValue = model[key];
    const camelCaseKey = fromSnakeToCamelCase(key);
    const isObject = typeof originalValue === "object";
    const isNotArray = !Array.isArray(originalValue);
    const isNotRelation = !(originalValue instanceof Relation);
    const isNotDate = !(originalValue instanceof Date);
    if (originalValue && isObject && isNotArray && isNotRelation && isNotDate) {
      camelCaseModel[camelCaseKey] = parseModel(originalValue);
    } else if (isNotRelation && isNotDate) {
      camelCaseModel[camelCaseKey] = originalValue;
    }
  });
  return camelCaseModel;
}

// src/Sql/Models/Model.ts
var Model = class {
  constructor(tableName, primaryKey) {
    __publicField(this, "metadata");
    __publicField(this, "aliasColumns", {});
    this.metadata = {
      tableName: tableName || camelToSnakeCase(this.constructor.name) + "s",
      primaryKey
    };
  }
  setProps(data) {
    for (const key in data) {
      Object.assign(this, { [key]: data[key] });
    }
  }
};

// src/Sql/Models/Relations/HasOne.ts
var HasOne = class extends Relation {
  constructor(relatedModel, foreignKey) {
    super(relatedModel);
    __publicField(this, "type");
    __publicField(this, "foreignKey");
    this.foreignKey = foreignKey;
    this.type = "hasOne" /* hasOne */;
  }
};

// src/Sql/Models/Relations/HasMany.ts
var HasMany = class extends Relation {
  constructor(relatedModel, foreignKey) {
    super(relatedModel);
    __publicField(this, "type", "hasMany" /* hasMany */);
    __publicField(this, "foreignKey");
    this.foreignKey = foreignKey;
    this.type = "hasMany" /* hasMany */;
  }
};

// src/Sql/Models/Relations/BelongsTo.ts
var BelongsTo = class extends Relation {
  constructor(relatedModel, foreignKey) {
    super(relatedModel);
    __publicField(this, "type");
    __publicField(this, "foreignKey");
    this.foreignKey = foreignKey;
    this.type = "belongsTo" /* belongsTo */;
  }
};

// src/Datasource.ts
var Datasource = class {
  constructor(input) {
    __publicField(this, "type");
    __publicField(this, "host");
    __publicField(this, "port");
    __publicField(this, "username");
    __publicField(this, "password");
    __publicField(this, "database");
    __publicField(this, "logs");
    this.type = input.type;
    this.host = input.host;
    this.port = input.port;
    this.username = input.username;
    this.password = input.password;
    this.database = input.database;
    this.logs = input.logs || false;
  }
};

// src/Sql/SqlDatasource.ts
import { createPool } from "mysql2/promise";
import pg from "pg";

// src/Sql/Templates/Query/SELECT.ts
var selectTemplate = (table) => {
  return {
    selectAll: `SELECT * FROM ${table} `,
    selectById: (id) => `SELECT * FROM ${table} WHERE id = ${id} `,
    selectColumns: (...columns) => {
      columns = columns.map((column) => {
        if (column === "*" || column.includes("as") || column.includes("AS")) {
          return column;
        }
        return camelToSnakeCase(column);
      });
      return `SELECT ${columns.join(", ")} FROM ${table} `;
    },
    selectCount: `SELECT COUNT(*) FROM ${table} `,
    selectDistinct: (...columns) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      return `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `;
    },
    selectSum: (column) => `SELECT SUM(${camelToSnakeCase(column)}) FROM ${table} `,
    orderBy: (column, order) => {
      column = column.map((column2) => camelToSnakeCase(column2));
      return `
ORDER BY ${column.join(", ")} ${order}`;
    },
    groupBy: (...columns) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      return `
GROUP BY ${columns.join(", ")} `;
    },
    limit: (limit) => `
LIMIT ${limit} `,
    offset: (offset) => `
OFFSET ${offset} `
  };
};
var SELECT_default = selectTemplate;

// src/Sql/Templates/Query/INSERT.ts
var insertTemplate = (tableName) => {
  return {
    insert: (columns, values) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      values = parseValues(values);
      return `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES (${values.join(", ")});`;
    },
    insertMany: (columns, values) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      const parsedValues = values.map(parseValues);
      const valueSets = parsedValues.map((val) => `(${val.join(", ")})`);
      return `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES ${valueSets.join(", ")};`;
    }
  };
};
function parseValues(values) {
  return values.map((value) => {
    if (typeof value === "string") {
      return `'${value}'`;
    }
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }
    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }
    if (value === null) {
      return "NULL";
    }
    if (typeof value === "function") {
      return;
    }
    return value || "DEFAULT";
  });
}
var INSERT_default = insertTemplate;

// src/Sql/Templates/Query/UPDATE.ts
var updateTemplate = (table) => {
  return {
    update: (columns, values, primaryKey, primaryKeyValue) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      return `UPDATE ${table} SET ${columns.map((column, index) => parseColumnValue(column, values[index])).filter((column) => column !== void 0).join(", ")} WHERE ${primaryKey} = ${primaryKeyValue};`;
    }
  };
};
function parseColumnValue(column, value) {
  if (typeof value === "string") {
    return `${column} = '${value}'`;
  }
  if (typeof value === "number") {
    return `${column} = ${value}`;
  }
  if (typeof value === "boolean") {
    return `${column} = ${value ? 1 : 0}`;
  }
  if (value instanceof Date) {
    return `${column} = '${value.toISOString()}'`;
  }
  if (value === null) {
    return `${column} = NULL`;
  }
  if (typeof value === "function") {
    return;
  }
  return `${column} = ${value}`;
}
var UPDATE_default = updateTemplate;

// src/Sql/Templates/Query/DELETE.ts
var deleteTemplate = (tableName) => {
  return {
    delete: (column, value) => `
DELETE FROM ${tableName} WHERE ${column} = ${parseValue(value)} `
  };
};
function parseValue(value) {
  if (typeof value === "string") {
    return `'${value}'`;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  return value;
}
var DELETE_default = deleteTemplate;

// src/Logger.ts
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
function log(query, logs) {
  if (!logs) {
    return;
  }
  logger.info("\n" + query);
}
function queryError(error) {
  logger.error("Query Failed ", error);
}

// src/Sql/Templates/Query/RELATIONS.ts
function relationTemplates(model, relation) {
  const primaryKey = model.metadata.primaryKey;
  switch (relation.type) {
    case "hasOne" /* hasOne */:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${camelToSnakeCase(relation.foreignKey)} = ${camelToSnakeCase(
        model[primaryKey]
      )} LIMIT 1;`;
    case "belongsTo" /* belongsTo */:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${primaryKey.toString()} = ${model[camelToSnakeCase(relation.foreignKey)]};`;
    case "hasMany" /* hasMany */:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${camelToSnakeCase(relation.foreignKey)} = ${camelToSnakeCase(
        model[primaryKey]
      )};`;
    default:
      return "";
  }
}
var RELATIONS_default = relationTemplates;

// src/Sql/Templates/Query/WHERE.TS.ts
var whereTemplate = (_tableName) => {
  return {
    where: (column, value, operator = "=") => `
WHERE ${camelToSnakeCase(column)} ${operator} ${parseValue2(value)}`,
    andWhere: (column, value, operator = "=") => ` AND ${camelToSnakeCase(column)} ${operator} ${parseValue2(value)}`,
    orWhere: (column, value, operator = "=") => ` OR ${camelToSnakeCase(column)} ${operator} ${parseValue2(value)}`,
    whereNot: (column, value) => `
WHERE ${camelToSnakeCase(column)} != ${parseValue2(value)}`,
    andWhereNot: (column, value) => ` AND ${camelToSnakeCase(column)} != ${parseValue2(value)}`,
    orWhereNot: (column, value) => ` OR ${camelToSnakeCase(column)} != ${parseValue2(value)}`,
    whereNull: (column) => `
WHERE ${camelToSnakeCase(column)} IS NULL`,
    andWhereNull: (column) => ` AND ${camelToSnakeCase(column)} IS NULL`,
    orWhereNull: (column) => ` OR ${camelToSnakeCase(column)} IS NULL`,
    whereNotNull: (column) => `
WHERE ${camelToSnakeCase(column)} IS NOT NULL`,
    andWhereNotNull: (column) => ` AND ${camelToSnakeCase(column)} IS NOT NULL`,
    orWhereNotNull: (column) => ` OR ${camelToSnakeCase(column)} IS NOT NULL`,
    whereBetween: (column, min, max) => `
WHERE ${camelToSnakeCase(column)} BETWEEN ${min} AND ${max}`,
    andWhereBetween: (column, min, max) => ` AND ${camelToSnakeCase(column)} BETWEEN ${min} AND ${max}`,
    orWhereBetween: (column, min, max) => ` OR ${camelToSnakeCase(column)} BETWEEN ${min} AND ${max}`,
    whereNotBetween: (column, min, max) => `
WHERE ${camelToSnakeCase(column)} NOT BETWEEN ${min} AND ${max}`,
    andWhereNotBetween: (column, min, max) => ` AND ${camelToSnakeCase(column)} NOT BETWEEN ${min} AND ${max}`,
    orWhereNotBetween: (column, min, max) => ` OR ${camelToSnakeCase(column)} NOT BETWEEN ${min} AND ${max}`,
    whereIn: (column, values) => `
WHERE ${camelToSnakeCase(column)} IN (${values.map((value) => parseValue2(value)).join(", ")})`,
    andWhereIn: (column, values) => ` AND ${camelToSnakeCase(column)} IN (${values.map((value) => parseValue2(value)).join(", ")})`,
    orWhereIn: (column, values) => ` OR ${camelToSnakeCase(column)} IN (${values.map((value) => parseValue2(value)).join(", ")})`,
    whereNotIn: (column, values) => `
WHERE ${camelToSnakeCase(column)} NOT IN (${values.map((value) => parseValue2(value)).join(", ")})`,
    andWhereNotIn: (column, values) => ` AND ${camelToSnakeCase(column)} NOT IN (${values.map((value) => parseValue2(value)).join(", ")})`,
    orWhereNotIn: (column, values) => ` OR ${camelToSnakeCase(column)} NOT IN (${values.map((value) => parseValue2(value)).join(", ")})`,
    rawWhere: (query) => `
WHERE ${query} `,
    rawAndWhere: (query) => ` AND ${query} `,
    rawOrWhere: (query) => ` OR ${query} `
  };
};
function parseValue2(value) {
  if (typeof value === "string") {
    return `'${value}'`;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return `'${value.toISOString()}'`;
}
var WHERE_TS_default = whereTemplate;

// src/Sql/Mysql/MySqlModelManagerUtils.ts
var MySqlModelManagerUtils = class {
  parseSelectQueryInput(model, input) {
    let query = "";
    query += this.parseSelect(model.metadata.tableName, input);
    query += this.parseWhere(model.metadata.tableName, input);
    query += this.parseQueryFooter(model.metadata.tableName, input);
    return query;
  }
  parseSelect(tableName, input) {
    const select = SELECT_default(tableName);
    return input.select ? select.selectColumns(...input.select) : select.selectAll;
  }
  parseWhere(tableName, input) {
    const where = WHERE_TS_default(tableName);
    if (!input.where) {
      return "";
    }
    let query = "";
    const entries = Object.entries(input.where);
    for (let index = 0; index < entries.length; index++) {
      const [key, value] = entries[index];
      if (index === 0) {
        query += where.where(key, value);
        continue;
      }
      query += where.andWhere(key, value);
    }
    return query;
  }
  parseQueryFooter(tableName, input) {
    if (!this.isFindType(input)) {
      return "";
    }
    const select = SELECT_default(tableName);
    let query = "";
    if (input.offset) {
      query += select.offset(input.offset);
    }
    if (input.groupBy) {
      query += select.groupBy(...input.groupBy);
    }
    if (input.orderBy) {
      query += select.orderBy([...input.orderBy.columns], input.orderBy.type);
    }
    if (input.limit) {
      query += select.limit(input.limit);
    }
    return query;
  }
  parseInsert(model) {
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const insert = INSERT_default(model.metadata.tableName);
    return insert.insert(keys, values);
  }
  parseUpdate(model, modelName) {
    const update = UPDATE_default(modelName || model.metadata.tableName);
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const primaryKey = model.metadata.primaryKey;
    const primaryKeyValue = model[primaryKey];
    return update.update(keys, values, primaryKey, primaryKeyValue);
  }
  filterRelationsAndMetadata(model) {
    const filteredModel = {};
    const keys = Object.keys(model);
    for (const key of keys) {
      if (key === "metadata") {
        continue;
      }
      if (typeof model[key] === "object" && (model[key] !== null || !Array.isArray(model[key]))) {
        continue;
      }
      Object.assign(filteredModel, { [key]: model[key] });
    }
    return filteredModel;
  }
  parseDelete(tableName, column, value) {
    return DELETE_default(tableName).delete(column, value.toString());
  }
  isFindType(input) {
    const instance = input;
    return instance.hasOwnProperty("offset") || instance.hasOwnProperty("groupBy") || instance.hasOwnProperty("orderBy") || instance.hasOwnProperty("limit");
  }
  /*private _parseJoin(model: T, input: FindType | FindOneType): string {
      if (!input.relations) {
        return "";
      }
  
      const relations: string[] = input.relations.map((relationField) => {
        const relation: Relation = this.getRelationFromModel(
          model,
          relationField,
        );
        const join = joinTemplate(model.metadata.tableName, relation.relatedModel);
        switch (relation.type) {
          case RelationType.belongsTo:
            const belongsTo = relation as BelongsTo;
            return join.belongsTo(belongsTo.foreignKey);
  
          case RelationType.hasOne:
            return join.hasOne();
          case RelationType.hasMany:
            return join.hasMany(model.metadata.primaryKey as string);
  
          default:
            throw new Error("Relation type not supported");
        }
      });
  
      return relations.join("\n");
    }*/
  getRelationFromModel(model, relationField) {
    const relation = model[relationField];
    if (!relation) {
      throw new Error(
        "Relation " + relationField + " not found in model " + model.metadata.tableName
      );
    }
    return relation;
  }
  // Parses and fills input relations directly into the model
  async parseRelationInput(model, input, mysqlConnection, logs) {
    if (!input.relations) {
      return;
    }
    if (!model.metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }
    try {
      const relationPromises = input.relations.map(
        async (inputRelation) => {
          const relation = this.getRelationFromModel(model, inputRelation);
          const relationQuery = RELATIONS_default(model, relation);
          console.log(relationQuery);
          const [relatedModels] = await mysqlConnection.query(relationQuery);
          if (relatedModels.length === 0) {
            Object.assign(model, { [inputRelation]: null });
            log(relationQuery, logs);
            return;
          }
          if (relatedModels.length === 1) {
            Object.assign(model, {
              [inputRelation]: relatedModels[0]
            });
            log(relationQuery, logs);
            return;
          }
          Object.assign(model, { [inputRelation]: relatedModels });
          log(relationQuery, logs);
        }
      );
      await Promise.all(relationPromises);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to parse relations " + error);
    }
  }
  // Parses and fills input relations directly into the model
  async parseQueryBuilderRelations(model, input, mysqlConnection, logs) {
    if (input.length === 0) {
      return;
    }
    if (!model.metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }
    let relationQuery = "";
    try {
      const relationPromises = input.map(async (inputRelation) => {
        const relation = this.getRelationFromModel(model, inputRelation);
        relationQuery = RELATIONS_default(model, relation);
        const [relatedModels] = await mysqlConnection.query(relationQuery);
        if (relatedModels.length === 0) {
          Object.assign(model, { [inputRelation]: null });
          log(relationQuery, logs);
          return;
        }
        if (relatedModels.length === 1) {
          Object.assign(model, {
            [inputRelation]: relatedModels[0]
          });
          log(relationQuery, logs);
          return;
        }
        Object.assign(model, { [inputRelation]: relatedModels });
        log(relationQuery, logs);
      });
      await Promise.all(relationPromises);
    } catch (error) {
      queryError("Query Error: " + relationQuery + error);
      throw new Error("Failed to parse relations " + error);
    }
  }
};
var MySqlModelManagerUtils_default = new MySqlModelManagerUtils();

// src/Sql/QueryBuilder/QueryBuilder.ts
var QueryBuilder = class {
  /**
   * @description Constructs a MysqlQueryBuilder instance.
   * @param model - The model class associated with the table.
   * @param tableName - The name of the table.
   * @param logs - A boolean indicating whether to log queries.
   */
  constructor(model, tableName, logs) {
    __publicField(this, "selectQuery", "");
    __publicField(this, "joinQuery", "");
    __publicField(this, "relations", []);
    __publicField(this, "whereQuery", "");
    __publicField(this, "groupByQuery", "");
    __publicField(this, "orderByQuery", "");
    __publicField(this, "limitQuery", "");
    __publicField(this, "offsetQuery", "");
    __publicField(this, "model");
    __publicField(this, "tableName");
    __publicField(this, "logs");
    __publicField(this, "selectTemplate");
    __publicField(this, "whereTemplate");
    this.model = model;
    this.logs = logs;
    this.tableName = tableName;
    this.selectQuery = SELECT_default(this.tableName).selectAll;
    this.selectTemplate = SELECT_default(this.tableName);
    this.whereTemplate = WHERE_TS_default(this.tableName);
  }
  groupFooterQuery() {
    return this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
  }
};

// src/Sql/Templates/Query/JOIN.ts
var joinTemplate = (_table, relatedTable, primaryColumn, foreignColumn) => {
  return {
    innerJoin: () => {
      return `
INNER JOIN ${relatedTable} ON ${primaryColumn} = ${foreignColumn}`;
    },
    leftJoin: () => {
      return `
LEFT JOIN ${relatedTable} ON ${primaryColumn} = ${foreignColumn}`;
    }
  };
};
var JOIN_default = joinTemplate;

// src/Sql/Mysql/MysqlQueryBuilder.ts
var MysqlQueryBuilder = class extends QueryBuilder {
  /**
   * @description Constructs a MysqlQueryBuilder instance.
   * @param model - The model class associated with the table.
   * @param tableName - The name of the table.
   * @param mysqlPool - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   */
  constructor(model, tableName, mysqlPool, logs) {
    super(model, tableName, logs);
    __publicField(this, "mysqlPool");
    this.mysqlPool = mysqlPool;
  }
  mergeRetrievedDataIntoModel(model, row) {
    Object.entries(row).forEach(([key, value]) => {
      if (Object.hasOwnProperty.call(model, key)) {
        Object.assign(model, { [key]: value });
      } else {
        model.aliasColumns[key] = value;
      }
    });
  }
  /**
   * @description Executes the query and retrieves the first result.
   * @returns A Promise resolving to the first result or null.
   */
  async one() {
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = SELECT_default(this.tableName);
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    log(query, this.logs);
    const model = new this.model();
    try {
      const [rows] = await this.mysqlPool.query(query);
      const modelData = rows[0];
      this.mergeRetrievedDataIntoModel(model, modelData);
      await MySqlModelManagerUtils_default.parseQueryBuilderRelations(
        model,
        this.relations,
        this.mysqlPool,
        this.logs
      );
      return parseDatabaseDataIntoModelResponse([model]);
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Executes the query and retrieves multiple results.
   * @returns A Promise resolving to an array of results.
   */
  async many() {
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = SELECT_default(this.tableName);
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query += this.groupFooterQuery();
    log(query, this.logs);
    const model = new this.model();
    try {
      const [rows] = await this.mysqlPool.query(query);
      return Promise.all(
        rows.map(async (row) => {
          const modelData = rows[0];
          this.mergeRetrievedDataIntoModel(model, row);
          await MySqlModelManagerUtils_default.parseQueryBuilderRelations(
            model,
            this.relations,
            this.mysqlPool,
            this.logs
          );
          return parseDatabaseDataIntoModelResponse([model]);
        })
      );
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Paginates the query results with the given page and limit.
   * @param page
   * @param limit
   */
  async paginate(page, limit) {
    const models = await this.many();
    return parseDatabaseDataIntoModelResponse(models, {
      page,
      limit
    });
  }
  /**
   * @description Columns are customizable with aliases. By default, without this function, all columns are selected
   * @param columns
   */
  select(...columns) {
    const select = SELECT_default(this.tableName);
    this.selectQuery = select.selectColumns(...columns);
    return this;
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.tableName,
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
      this.tableName,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  addRelations(relations) {
    this.relations = relations;
    return this;
  }
  /**
   * @description Adds a WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  where(column, operator, value) {
    if (this.whereQuery) {
      this.whereQuery += this.whereTemplate.andWhere(column, value, operator);
      return this;
    }
    this.whereQuery = this.whereTemplate.where(column, value, operator);
    return this;
  }
  /**
   * @description Adds an AND WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  andWhere(column, operator, value) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(column, value, operator);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhere(
      column,
      value,
      operator
    );
    return this;
  }
  /**
   * @description Adds an OR WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  orWhere(column, operator, value) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(column, value, operator);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhere(
      column,
      value,
      operator
    );
    return this;
  }
  /**
   * @description Adds a WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  whereBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereBetween(
      column,
      min,
      max
    );
    return this;
  }
  /**
   * @description Adds an AND WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  andWhereBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhereBetween(
      column,
      min,
      max
    );
    return this;
  }
  /**
   * @description Adds an OR WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  orWhereBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereBetween(
      column,
      min,
      max
    );
    return this;
  }
  /**
   * @description Adds a WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  whereNotBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereNotBetween(
      column,
      min,
      max
    );
    return this;
  }
  /**
   * @description Adds an OR WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  orWhereNotBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereNotBetween(
      column,
      min,
      max
    );
    return this;
  }
  /**
   * @description Adds a WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  whereIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereIn(column, values);
    return this;
  }
  /**
   * @description Adds an AND WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  andWhereIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhereIn(column, values);
    return this;
  }
  /**
   * @description Adds an OR WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  orWhereIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereIn(column, values);
    return this;
  }
  /**
   * @description Adds a WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  whereNotIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereNotIn(column, values);
    return this;
  }
  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  orWhereNotIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereNotIn(
      column,
      values
    );
    return this;
  }
  /**
   * @description Adds a WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  whereNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereNull(column);
    return this;
  }
  /**
   * @description Adds an AND WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  andWhereNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhereNull(column);
    return this;
  }
  /**
   * @description Adds an OR WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  orWhereNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereNull(column);
    return this;
  }
  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  whereNotNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereNotNull(column);
    return this;
  }
  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  andWhereNotNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhereNotNull(column);
    return this;
  }
  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  orWhereNotNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereNotNull(column);
    return this;
  }
  /**
   * @description Adds a raw WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  rawWhere(query) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawAndWhere(query);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).rawWhere(query);
    return this;
  }
  /**
   * @description Adds a raw AND WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  rawAndWhere(query) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).rawAndWhere(query);
    return this;
  }
  /**
   * @description Adds a raw OR WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  rawOrWhere(query) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).rawOrWhere(query);
    return this;
  }
  /**
   * @description Adds GROUP BY conditions to the query.
   * @param columns - The columns to group by.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  /**
   * @description Adds ORDER BY conditions to the query.
   * @param column - The column to order by.
   * @param order - The order direction, either "ASC" or "DESC".
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  orderBy(column, order) {
    this.orderByQuery = this.selectTemplate.orderBy(column, order);
    return this;
  }
  /**
   * @description Adds a LIMIT condition to the query.
   * @param limit - The maximum number of rows to return.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  limit(limit) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }
  /**
   * @description Adds an OFFSET condition to the query.
   * @param offset - The number of rows to skip.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  offset(offset) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }
  groupFooterQuery() {
    return this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
  }
};

// src/Sql/Templates/Query/TRANSACTION.ts
var BEGIN_TRANSACTION = "BEGIN; \n";
var COMMIT_TRANSACTION = "COMMIT; \n";
var ROLLBACK_TRANSACTION = "ROLLBACK; \n";

// src/Sql/Mysql/MysqlTransaction.ts
var MysqlTransaction = class {
  constructor(mysql2, tableName, logs) {
    __publicField(this, "tableName");
    __publicField(this, "mysql");
    __publicField(this, "mysqlConnection");
    __publicField(this, "logs");
    this.logs = logs;
    this.mysql = mysql2;
    this.tableName = tableName;
  }
  async queryInsert(query, metadata, params) {
    if (!this.mysqlConnection) {
      throw new Error("MysqlTransaction not started.");
    }
    log(query, this.logs);
    const [rows] = await this.mysqlConnection.query(
      query,
      params
    );
    const insertId = rows.insertId;
    const select = SELECT_default(this.tableName).selectById(insertId);
    const [savedModel] = await this.mysqlConnection.query(select);
    Object.assign(savedModel[0], { metadata });
    return savedModel[0];
  }
  async queryUpdate(query, params) {
    if (!this.mysqlConnection) {
      throw new Error("MysqlTransaction not started.");
    }
    log(query, this.logs);
    const [rows] = await this.mysqlConnection.query(
      query,
      params
    );
    return rows.affectedRows;
  }
  async queryDelete(query, params) {
    if (!this.mysqlConnection) {
      throw new Error("MysqlTransaction not started.");
    }
    log(query, this.logs);
    const [rows] = await this.mysqlConnection.query(
      query,
      params
    );
    return rows.affectedRows;
  }
  /**
   * Start transaction.
   */
  async start() {
    try {
      log(BEGIN_TRANSACTION, this.logs);
      this.mysqlConnection = await this.mysql.getConnection();
      await this.mysqlConnection.query(BEGIN_TRANSACTION);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to start transaction " + error);
    }
  }
  /**
   * Commit transaction.
   */
  async commit() {
    if (!this.mysqlConnection) {
      throw new Error("MysqlTransaction not started.");
    }
    try {
      log(COMMIT_TRANSACTION, this.logs);
      await this.mysqlConnection.query(COMMIT_TRANSACTION);
      this.mysqlConnection.release();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to commit transaction " + error);
    }
  }
  /**
   * Rollback transaction.
   */
  async rollback() {
    if (!this.mysqlConnection) {
      return;
    }
    try {
      log(ROLLBACK_TRANSACTION, this.logs);
      await this.mysqlConnection.query(ROLLBACK_TRANSACTION);
      this.mysqlConnection.release();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to rollback transaction " + error);
    }
  }
};

// src/Sql/Models/ModelManager/AbstractModelManager.ts
var AbstractModelManager = class {
  constructor(model, logs) {
    __publicField(this, "logs");
    __publicField(this, "model");
    __publicField(this, "modelInstance");
    __publicField(this, "tableName");
    this.logs = logs;
    this.model = model;
    this.modelInstance = new this.model();
    this.tableName = this.modelInstance.metadata.tableName;
  }
};

// src/Sql/Mysql/MysqlModelManager.ts
var MysqlModelManager = class extends AbstractModelManager {
  /**
   * Constructor for MysqlModelManager class.
   *
   * @param {new () => T} model - Model constructor.
   * @param {Pool} mysqlConnection - MySQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model, mysqlConnection, logs) {
    super(model, logs);
    __publicField(this, "mysqlPool");
    this.mysqlPool = mysqlConnection;
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
        const select = SELECT_default(this.tableName);
        log(select.selectAll, this.logs);
        const [rows2] = await this.mysqlPool.query(
          select.selectAll
        );
        const models = rows2.map((row) => {
          const model = row;
          model.metadata = this.modelInstance.metadata;
          model.aliasColumns = this.modelInstance.aliasColumns;
          model.setProps = this.modelInstance.setProps;
          return parseDatabaseDataIntoModelResponse([model]);
        }) || [];
        return models.map(
          (model) => parseDatabaseDataIntoModelResponse([model])
        ) || [];
      }
      const query = MySqlModelManagerUtils_default.parseSelectQueryInput(
        new this.model(),
        input
      );
      log(query, this.logs);
      const [rows] = await this.mysqlPool.query(query);
      return Promise.all(
        rows.map(async (row) => {
          const model = new this.model();
          const modelData = rows[0];
          Object.assign(model, modelData);
          await MySqlModelManagerUtils_default.parseRelationInput(
            model,
            input,
            this.mysqlPool,
            this.logs
          );
          return parseDatabaseDataIntoModelResponse([model]);
        })
      );
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - Query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    const model = new this.model();
    try {
      const query = MySqlModelManagerUtils_default.parseSelectQueryInput(model, input);
      log(query, this.logs);
      const [rows] = await this.mysqlPool.query(query);
      const modelData = rows[0];
      Object.assign(model, modelData);
      await MySqlModelManagerUtils_default.parseRelationInput(
        model,
        input,
        this.mysqlPool,
        this.logs
      );
      return parseDatabaseDataIntoModelResponse([model]);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Find a single record by its ID from the database.
   *
   * @param {string | number} id - ID of the record to retrieve.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneById(id) {
    const select = SELECT_default(this.tableName);
    try {
      const stringedId = typeof id === "number" ? id.toString() : id;
      const query = select.selectById(stringedId);
      log(query, this.logs);
      const [rows] = await this.mysqlPool.query(query);
      const modelData = rows[0];
      return parseDatabaseDataIntoModelResponse([modelData]);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  async save(model, trx) {
    if (trx) {
      return await trx.queryInsert(
        MySqlModelManagerUtils_default.parseInsert(model),
        this.modelInstance.metadata
      );
    }
    try {
      const insertQuery = MySqlModelManagerUtils_default.parseInsert(model);
      log(insertQuery, this.logs);
      const [result] = await this.mysqlPool.query(insertQuery);
      return await this.findOneById(result["insertId"]);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async update(model, trx) {
    const primaryKeyValue = this.modelInstance.metadata.primaryKey;
    if (trx) {
      await trx.queryUpdate(MySqlModelManagerUtils_default.parseUpdate(model));
      return await this.findOneById(
        model[primaryKeyValue]
      );
    }
    try {
      const updateQuery = MySqlModelManagerUtils_default.parseUpdate(model);
      log(updateQuery, this.logs);
      await this.mysqlPool.query(updateQuery);
      return await this.findOneById(
        model[primaryKeyValue]
      );
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Delete a record from the database from the given column and value.
   *
   * @param {string} column - Column to filter by.
   * @param {string | number | boolean} value - Value to filter by.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
   * @returns Promise resolving to affected rows count
   */
  async deleteByColumn(column, value, trx) {
    if (trx) {
      return await trx.queryDelete(
        MySqlModelManagerUtils_default.parseDelete(this.tableName, column, value)
      );
    }
    try {
      const deleteQuery = MySqlModelManagerUtils_default.parseDelete(
        this.tableName,
        column,
        value
      );
      log(deleteQuery, this.logs);
      const [rows] = await this.mysqlPool.query(deleteQuery);
      return rows.affectedRows;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async delete(model, trx) {
    try {
      if (!model.metadata.primaryKey) {
        throw new Error(
          "Model " + model.metadata.tableName + " has no primary key to be deleted from, try deleteByColumn"
        );
      }
      const deleteQuery = MySqlModelManagerUtils_default.parseDelete(
        this.tableName,
        model.metadata.primaryKey,
        model[model.metadata.primaryKey]
      );
      if (trx) {
        await trx.queryDelete(deleteQuery);
        return model;
      }
      log(deleteQuery, this.logs);
      await this.mysqlPool.query(deleteQuery);
      return model;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Creates a new transaction.
   * @returns {MysqlTransaction} - Instance of MysqlTransaction.
   */
  createTransaction() {
    return new MysqlTransaction(this.mysqlPool, this.tableName, this.logs);
  }
  /**
   * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
   */
  query() {
    return new MysqlQueryBuilder(
      this.model,
      this.tableName,
      this.mysqlPool,
      this.logs
    );
  }
};

// src/Sql/Postgres/PostgresModelManagerUtils.ts
var PostgresModelManagerUtils = class {
  parseSelectQueryInput(model, input) {
    let query = "";
    query += this.parseSelect(model.metadata.tableName, input);
    query += this.parseWhere(model.metadata.tableName, input);
    query += this.parseQueryFooter(model.metadata.tableName, input);
    return query;
  }
  parseSelect(tableName, input) {
    const select = SELECT_default(tableName);
    return input.select ? select.selectColumns(...input.select) : select.selectAll;
  }
  parseWhere(tableName, input) {
    const where = WHERE_TS_default(tableName);
    if (!input.where) {
      return "";
    }
    let query = "";
    const entries = Object.entries(input.where);
    for (let index = 0; index < entries.length; index++) {
      const [key, value] = entries[index];
      if (index === 0) {
        query += where.where(key, value);
        continue;
      }
      query += where.andWhere(key, value);
    }
    return query;
  }
  parseQueryFooter(tableName, input) {
    if (!this.isFindType(input)) {
      return "";
    }
    const select = SELECT_default(tableName);
    let query = "";
    if (input.offset) {
      query += select.offset(input.offset);
    }
    if (input.groupBy) {
      query += select.groupBy(...input.groupBy);
    }
    if (input.orderBy) {
      query += select.orderBy([...input.orderBy.columns], input.orderBy.type);
    }
    if (input.limit) {
      query += select.limit(input.limit);
    }
    return query;
  }
  parseInsert(model) {
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const insert = INSERT_default(model.metadata.tableName);
    return insert.insert(keys, values);
  }
  parseUpdate(model, modelName) {
    const update = UPDATE_default(modelName || model.metadata.tableName);
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const primaryKey = model.metadata.primaryKey;
    const primaryKeyValue = model[primaryKey];
    return update.update(keys, values, primaryKey, primaryKeyValue);
  }
  filterRelationsAndMetadata(model) {
    const filteredModel = {};
    const keys = Object.keys(model);
    for (const key of keys) {
      if (key === "metadata") {
        continue;
      }
      if (typeof model[key] === "object" && (model[key] !== null || !Array.isArray(model[key]))) {
        continue;
      }
      Object.assign(filteredModel, { [key]: model[key] });
    }
    return filteredModel;
  }
  parseDelete(tableName, column, value) {
    return DELETE_default(tableName).delete(column, value.toString());
  }
  isFindType(input) {
    const instance = input;
    return instance.hasOwnProperty("offset") || instance.hasOwnProperty("groupBy") || instance.hasOwnProperty("orderBy") || instance.hasOwnProperty("limit");
  }
  getRelationFromModel(model, relationField) {
    const relation = model[relationField];
    if (!relation) {
      throw new Error(
        "Relation " + relationField + " not found in model " + model.metadata.tableName
      );
    }
    return relation;
  }
  // Parses and fills input relations directly into the model
  async parseRelationInput(model, input, pgPool, logs) {
    if (!input.relations) {
      return;
    }
    if (!model.metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }
    try {
      const relationPromises = input.relations.map(
        async (inputRelation) => {
          const relation = this.getRelationFromModel(model, inputRelation);
          const relationQuery = RELATIONS_default(model, relation);
          console.log(relationQuery);
          const { rows } = await pgPool.query(relationQuery);
          if (rows.length === 0) {
            Object.assign(model, { [inputRelation]: null });
            log(relationQuery, logs);
            return;
          }
          if (rows.length === 1) {
            Object.assign(model, {
              [inputRelation]: rows[0]
            });
            log(relationQuery, logs);
            return;
          }
          Object.assign(model, { [inputRelation]: rows });
          log(relationQuery, logs);
        }
      );
      await Promise.all(relationPromises);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to parse relations " + error);
    }
  }
  // Parses and fills input relations directly into the model
  async parseQueryBuilderRelations(model, input, pgConnection, logs) {
    if (input.length === 0) {
      return;
    }
    if (!model.metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }
    let relationQuery = "";
    try {
      const relationPromises = input.map(async (inputRelation) => {
        const relation = this.getRelationFromModel(model, inputRelation);
        relationQuery = RELATIONS_default(model, relation);
        const result = await pgConnection.query(relationQuery);
        const relatedModels = result.rows;
        if (relatedModels.length === 0) {
          Object.assign(model, { [inputRelation]: null });
        } else if (relatedModels.length === 1) {
          Object.assign(model, {
            [inputRelation]: relatedModels[0]
          });
        } else {
          Object.assign(model, { [inputRelation]: relatedModels });
        }
        log(relationQuery, logs);
      });
      await Promise.all(relationPromises);
    } catch (error) {
      queryError("Query Error: " + relationQuery + error);
      throw new Error("Failed to parse relations " + error);
    }
  }
};
var PostgresModelManagerUtils_default = new PostgresModelManagerUtils();

// src/Sql/Postgres/PostgresTransaction.ts
var PostgresTransaction = class {
  constructor(pgPool, tableName, logs) {
    __publicField(this, "tableName");
    __publicField(this, "pgPool");
    __publicField(this, "pgClient");
    __publicField(this, "logs");
    this.logs = logs;
    this.pgPool = pgPool;
    this.tableName = tableName;
  }
  async queryInsert(query, metadata, params) {
    if (!this.pgClient) {
      throw new Error("PostgresTransaction not started.");
    }
    try {
      log(query, this.logs);
      const { rows } = await this.pgClient.query(
        query,
        params
      );
      const insertId = rows[0][metadata.primaryKey];
      const select = SELECT_default(this.tableName).selectById(
        insertId
      );
      const { rows: savedModel } = await this.pgClient.query(select);
      return savedModel[0];
    } catch (error) {
      queryError(error);
      throw new Error("Failed to execute insert query in transaction " + error);
    }
  }
  async queryUpdate(query, params) {
    if (!this.pgClient) {
      throw new Error("PostgresTransaction not started.");
    }
    try {
      log(query, this.logs);
      const { rowCount } = await this.pgClient.query(
        query,
        params
      );
      return rowCount;
    } catch (error) {
      queryError(error);
      throw new Error("Failed to execute update query in transaction " + error);
    }
  }
  async queryDelete(query, params) {
    if (!this.pgClient) {
      throw new Error("PostgresTransaction not started.");
    }
    try {
      log(query, this.logs);
      const { rowCount } = await this.pgClient.query(
        query,
        params
      );
      return rowCount;
    } catch (error) {
      queryError(error);
      throw new Error("Failed to execute delete query in transaction " + error);
    }
  }
  /**
   * Start transaction.
   */
  async start() {
    try {
      this.pgClient = await this.pgPool.connect();
      await this.pgClient.query(BEGIN_TRANSACTION);
      log(BEGIN_TRANSACTION, this.logs);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to start transaction " + error);
    }
  }
  /**
   * Commit transaction.
   */
  async commit() {
    if (!this.pgClient) {
      throw new Error("PostgresTransaction not started.");
    }
    try {
      log(COMMIT_TRANSACTION, this.logs);
      await this.pgClient.query(COMMIT_TRANSACTION);
      this.pgClient.release();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to commit transaction " + error);
    }
  }
  /**
   * Rollback transaction.
   */
  async rollback() {
    if (!this.pgClient) {
      return;
    }
    try {
      log(ROLLBACK_TRANSACTION, this.logs);
      await this.pgClient.query(ROLLBACK_TRANSACTION);
      this.pgClient.release();
    } catch (error) {
      queryError(error);
      throw new Error("Failed to rollback transaction " + error);
    }
  }
};

// src/Sql/Postgres/PostgresQueryBuilder.ts
var PostgresQueryBuilder = class extends QueryBuilder {
  constructor(model, tableName, pgPool, logs) {
    super(model, tableName, logs);
    __publicField(this, "pgPool");
    this.pgPool = pgPool;
  }
  mergeRetrievedDataIntoModel(model, row) {
    Object.entries(row).forEach(([key, value]) => {
      if (Object.hasOwnProperty.call(model, key)) {
        Object.assign(model, { [key]: value });
      } else {
        model.aliasColumns[key] = value;
      }
    });
  }
  async one() {
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = SELECT_default(this.tableName);
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    log(query, this.logs);
    const model = new this.model();
    try {
      const result = await this.pgPool.query(query);
      const modelData = result.rows[0];
      if (modelData) {
        this.mergeRetrievedDataIntoModel(model, modelData);
        await PostgresModelManagerUtils_default.parseQueryBuilderRelations(
          model,
          this.relations,
          this.pgPool,
          this.logs
        );
        return parseDatabaseDataIntoModelResponse([model]);
      }
      return null;
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }
  async many() {
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = SELECT_default(this.tableName);
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query += this.groupFooterQuery();
    log(query, this.logs);
    const modelInstance = new this.model();
    try {
      const result = await this.pgPool.query(query);
      const rows = result.rows;
      return Promise.all(
        rows.map(async (row) => {
          const modelData = row;
          const rowModel = new this.model();
          this.mergeRetrievedDataIntoModel(rowModel, modelData);
          await PostgresModelManagerUtils_default.parseQueryBuilderRelations(
            rowModel,
            this.relations,
            this.pgPool,
            this.logs
          );
          return parseDatabaseDataIntoModelResponse([rowModel]);
        })
      );
    } catch (error) {
      throw new Error("Query failed: " + error.message);
    }
  }
  /**
   * @description Paginates the query results with the given page and limit.
   * @param page
   * @param limit
   */
  async paginate(page, limit) {
    const models = await this.many();
    return parseDatabaseDataIntoModelResponse(models, {
      page,
      limit
    });
  }
  select(...columns) {
    const select = SELECT_default(this.tableName);
    this.selectQuery = select.selectColumns(...columns);
    return this;
  }
  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  join(relationTable, primaryColumn, foreignColumn) {
    const join = JOIN_default(
      this.tableName,
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
      this.tableName,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join.innerJoin();
    return this;
  }
  addRelations(relations) {
    this.relations = relations;
    return this;
  }
  where(column, operator, value) {
    if (this.whereQuery) {
      this.whereQuery += this.whereTemplate.andWhere(column, value, operator);
      return this;
    }
    this.whereQuery = this.whereTemplate.where(column, value, operator);
    return this;
  }
  andWhere(column, operator, value) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(column, value, operator);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhere(
      column,
      value,
      operator
    );
    return this;
  }
  andWhereBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhereBetween(
      column,
      min,
      max
    );
    return this;
  }
  andWhereIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhereIn(column, values);
    return this;
  }
  andWhereNotNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhereNotNull(column);
    return this;
  }
  andWhereNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhereNull(column);
    return this;
  }
  groupBy(columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
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
  orWhere(column, operator, value) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(column, value, operator);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhere(
      column,
      value,
      operator
    );
    return this;
  }
  orWhereBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereBetween(
      column,
      min,
      max
    );
    return this;
  }
  orWhereIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereIn(column, values);
    return this;
  }
  orWhereNotBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereNotBetween(
      column,
      min,
      max
    );
    return this;
  }
  orWhereNotIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereNotIn(
      column,
      values
    );
    return this;
  }
  orWhereNotNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereNotNull(column);
    return this;
  }
  orWhereNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhereNull(column);
    return this;
  }
  orderBy(column, order) {
    this.orderByQuery = this.selectTemplate.orderBy(column, order);
    return this;
  }
  rawAndWhere(query) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).rawAndWhere(query);
    return this;
  }
  rawOrWhere(query) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).rawOrWhere(query);
    return this;
  }
  rawWhere(query) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawAndWhere(query);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).rawWhere(query);
    return this;
  }
  whereBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereBetween(
      column,
      min,
      max
    );
    return this;
  }
  whereIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereIn(column, values);
    return this;
  }
  whereNotBetween(column, min, max) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotBetween(column, min, max);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereNotBetween(
      column,
      min,
      max
    );
    return this;
  }
  whereNotIn(column, values) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotIn(column, values);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereNotIn(column, values);
    return this;
  }
  whereNotNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereNotNull(column);
    return this;
  }
  whereNull(column) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNull(column);
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).whereNull(column);
    return this;
  }
};

// src/Sql/Postgres/PostgresModelManager.ts
var PostgresModelManager = class extends AbstractModelManager {
  /**
   * Constructor for PostgresModelManager class.
   *
   * @param {new () => T} model - Model constructor.
   * @param {Pool} pgConnection - PostgreSQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model, pgConnection, logs) {
    super(model, logs);
    __publicField(this, "pgPool");
    this.pgPool = pgConnection;
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
        const select = SELECT_default(this.tableName);
        log(select.selectAll, this.logs);
        const { rows: rows2 } = await this.pgPool.query(
          select.selectAll
        );
        const models = rows2.map((row) => {
          const model = row;
          model.metadata = this.modelInstance.metadata;
          model.aliasColumns = this.modelInstance.aliasColumns;
          model.setProps = this.modelInstance.setProps;
          return parseDatabaseDataIntoModelResponse([model]);
        }) || [];
        return models.map(
          (model) => parseDatabaseDataIntoModelResponse([model])
        ) || [];
      }
      const query = MySqlModelManagerUtils_default.parseSelectQueryInput(
        new this.model(),
        input
      );
      log(query, this.logs);
      const { rows } = await this.pgPool.query(query);
      return Promise.all(
        rows.map(async (row) => {
          const model = new this.model();
          const modelData = row;
          Object.assign(model, modelData);
          await PostgresModelManagerUtils_default.parseRelationInput(
            model,
            input,
            this.pgPool,
            this.logs
          );
          return parseDatabaseDataIntoModelResponse([model]);
        })
      );
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - Query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    const model = new this.model();
    try {
      const query = MySqlModelManagerUtils_default.parseSelectQueryInput(model, input);
      log(query, this.logs);
      const { rows } = await this.pgPool.query(query);
      const modelData = rows[0];
      if (!modelData) {
        return null;
      }
      Object.assign(model, modelData);
      await PostgresModelManagerUtils_default.parseRelationInput(
        model,
        input,
        this.pgPool,
        this.logs
      );
      return parseDatabaseDataIntoModelResponse([model]);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Find a single record by its ID from the database.
   *
   * @param {string | number} id - ID of the record to retrieve.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneById(id) {
    const select = SELECT_default(this.tableName);
    try {
      const stringedId = typeof id === "number" ? id.toString() : id;
      const query = select.selectById(stringedId);
      log(query, this.logs);
      const { rows } = await this.pgPool.query(query);
      const modelData = rows[0];
      if (!modelData) {
        return null;
      }
      return parseDatabaseDataIntoModelResponse([modelData]);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  async save(model, trx) {
    if (trx) {
      return await trx.queryInsert(
        MySqlModelManagerUtils_default.parseInsert(model),
        this.modelInstance.metadata
      );
    }
    try {
      const insertQuery = MySqlModelManagerUtils_default.parseInsert(model);
      log(insertQuery, this.logs);
      const { rows } = await this.pgPool.query(insertQuery);
      const insertedModel = rows[0];
      if (!insertedModel) {
        return null;
      }
      return parseDatabaseDataIntoModelResponse([insertedModel]);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {PostgresTransaction} trx - PostgresTransaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async update(model, trx) {
    const primaryKeyValue = this.modelInstance.metadata.primaryKey;
    if (trx) {
      await trx.queryUpdate(MySqlModelManagerUtils_default.parseUpdate(model));
      return await this.findOneById(
        model[primaryKeyValue]
      );
    }
    try {
      const updateQuery = MySqlModelManagerUtils_default.parseUpdate(model);
      log(updateQuery, this.logs);
      await this.pgPool.query(updateQuery);
      return await this.findOneById(
        model[primaryKeyValue]
      );
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Delete a record from the database from the given column and value.
   *
   * @param {string} column - Column to filter by.
   * @param {string | number | boolean} value - Value to filter by.
   * @param {PostgresTransaction} trx - PostgresTransaction to be used on the delete operation.
   * @returns Promise resolving to affected rows count
   */
  async deleteByColumn(column, value, trx) {
    if (trx) {
      return await trx.queryDelete(
        MySqlModelManagerUtils_default.parseDelete(this.tableName, column, value)
      ) || 0;
    }
    try {
      const deleteQuery = MySqlModelManagerUtils_default.parseDelete(
        this.tableName,
        column,
        value
      );
      log(deleteQuery, this.logs);
      const result = await this.pgPool.query(deleteQuery);
      return result.rowCount || 0;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {PostgresTransaction} trx - PostgresTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async delete(model, trx) {
    try {
      if (!model.metadata.primaryKey) {
        throw new Error(
          "Model " + model.metadata.tableName + " has no primary key to be deleted from, try deleteByColumn"
        );
      }
      const deleteQuery = MySqlModelManagerUtils_default.parseDelete(
        this.tableName,
        model.metadata.primaryKey,
        model[model.metadata.primaryKey]
      );
      if (trx) {
        await trx.queryDelete(deleteQuery);
        return model;
      }
      log(deleteQuery, this.logs);
      await this.pgPool.query(deleteQuery);
      return model;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Creates a new transaction.
   * @returns {MysqlTransaction} - Instance of MysqlTransaction.
   */
  createTransaction() {
    return new PostgresTransaction(this.pgPool, this.tableName, this.logs);
  }
  /**
   * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
   */
  query() {
    return new PostgresQueryBuilder(
      this.model,
      this.tableName,
      this.pgPool,
      this.logs
    );
  }
};

// src/Sql/SqlDatasource.ts
var SqlDatasource = class extends Datasource {
  constructor(input) {
    super(input);
    __publicField(this, "sqlPool");
  }
  /**
   * @description Connects to the database establishing a connection pool.
   */
  async connect() {
    switch (this.type) {
      case "mysql":
        this.sqlPool = createPool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database
        });
        break;
      case "postgres":
        this.sqlPool = new pg.Pool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database
        });
        break;
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
  /**
   * @description Returns model manager for the provided model
   * @param model
   */
  getModelManager(model) {
    switch (this.type) {
      case "mysql":
        return new MysqlModelManager(
          model,
          this.sqlPool,
          this.logs
        );
      case "postgres":
        return new PostgresModelManager(
          model,
          this.sqlPool,
          this.logs
        );
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
  /**
   * @description Returns raw mysql pool
   */
  async getRawPool() {
    switch (this.type) {
      case "mysql":
        return createPool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database
        });
      case "postgres":
        return new pg.Pool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database
        });
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
  /**
   * @description Returns raw mysql PoolConnection
   */
  async getRawPoolConnection() {
    switch (this.type) {
      case "mysql":
        return createPool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database
        }).getConnection();
      case "postgres":
        return new pg.Pool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database
        }).connect();
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
};

// src/Sql/Migrations/Migration.ts
import path from "path";

// src/Sql/Migrations/Schema/Schema.ts
var import_dotenv = __toESM(require_main());

// src/Sql/Templates/Migration/CREATETABLE.ts
var createTableTemplate = {
  createTableIfNotExists: (tableName) => `
CREATE TABLE IF NOT EXISTS ${tableName} (
`,
  createTable: (tableName) => `
CREATE TABLE \`${tableName}\` (
`,
  createTableEnd: "\n);"
};
var CREATETABLE_default = createTableTemplate;

// src/Sql/Migrations/Columns/CreateTable/ColumnOptionsBuilder.ts
var ColumnOptionsBuilder = class _ColumnOptionsBuilder {
  constructor(tableName, queryStatements, partialQuery, sqlType, columnName = "", columnReferences) {
    __publicField(this, "tableName");
    __publicField(this, "queryStatements");
    __publicField(this, "partialQuery");
    __publicField(this, "columnName");
    __publicField(this, "columnReferences");
    __publicField(this, "sqlType");
    this.tableName = tableName;
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
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType
    );
  }
  /**
   * @description Makes the column unsigned allowing only positive values
   */
  unsigned() {
    this.partialQuery += " UNSIGNED";
    return new _ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType
    );
  }
  /**
   * @description Makes the column not nullable
   */
  notNullable() {
    this.partialQuery += " NOT NULL";
    return new _ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType
    );
  }
  /**
   * @description Makes the column the primary key
   */
  primary() {
    this.partialQuery += " PRIMARY KEY";
    return new _ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType
    );
  }
  /**
   * @description Adds an unique constraint
   */
  unique() {
    this.partialQuery += " UNIQUE";
    return new _ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType
    );
  }
  /**
   * @description Adds an auto increment - only for mysql
   */
  autoIncrement() {
    switch (this.sqlType) {
      case "mysql":
        this.partialQuery += " AUTO_INCREMENT";
        return new _ColumnOptionsBuilder(
          this.tableName,
          this.queryStatements,
          this.partialQuery,
          this.sqlType
        );
      case "postgres":
        throw new Error("Auto Increment not supported for PostgreSQL");
    }
  }
  /**
   * @description Adds a foreign key with a specific constraint
   * @param table
   * @param column
   */
  references(table, column) {
    this.columnReferences = { table, column };
    return new _ColumnOptionsBuilder(
      this.tableName,
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
    if (this.columnReferences) {
      this.partialQuery += `CONSTRAINT ${this.tableName}_${this.columnName}_fk FOREIGN KEY (${this.columnName}) REFERENCES ${this.columnReferences.table} (${this.columnReferences.column}),
`;
    }
    return new ColumnTypeBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType
    );
  }
  /**
   * @description Commits the column creation - if omitted, the migration will be run empty
   */
  commit() {
    if (this.columnReferences) {
      this.partialQuery += ",\n";
      this.partialQuery += `CONSTRAINT ${this.columnName}_fk FOREIGN KEY (${this.columnName}) REFERENCES ${this.columnReferences.table} (${this.columnReferences.column}),
`;
    }
    this.partialQuery += "\n";
    this.partialQuery += ");";
    this.queryStatements.push(this.partialQuery);
  }
};

// src/Sql/Migrations/Columns/CreateTable/ColumnTypeBuilder.ts
var ColumnTypeBuilder = class {
  constructor(tableName, queryStatements, partialQuery, sqlType) {
    __publicField(this, "tableName");
    __publicField(this, "queryStatements");
    __publicField(this, "partialQuery");
    __publicField(this, "columnName");
    __publicField(this, "sqlType");
    this.tableName = tableName;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
    this.columnName = "";
  }
  varchar(name, length) {
    this.columnName = name;
    this.partialQuery += `${name} VARCHAR(${length})`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  tinytext(name) {
    this.columnName = name;
    this.partialQuery += `${name} TINYTEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  mediumtext(name) {
    this.columnName = name;
    this.partialQuery += `${name} MEDIUMTEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  longtext(name) {
    this.columnName = name;
    this.partialQuery += `${name} LONGTEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  binary(name, length) {
    this.columnName = name;
    this.partialQuery += `${name} BINARY(${length})`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  enum(name, values) {
    this.columnName = name;
    this.partialQuery += `${name} ENUM("${values.join('","')}")`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  text(name) {
    this.columnName = name;
    this.partialQuery += `${name} TEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  char(name, length) {
    this.columnName = name;
    this.partialQuery += `${name} CHAR(${length})`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  tinyint(name) {
    this.columnName = name;
    this.partialQuery += `${name} TINYINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  smallint(name) {
    this.columnName = name;
    this.partialQuery += `${name} SMALLINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  mediumint(name) {
    this.columnName = name;
    this.partialQuery += `${name} MEDIUMINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  /**
   * @description If using mysql, it will automatically add INT AUTO_INCREMENT PRIMARY KEY
   * @param name
   */
  serial(name) {
    if (this.sqlType === `mysql`) {
      this.columnName = name;
      this.partialQuery += `${name} INT AUTO_INCREMENT PRIMARY KEY`;
      return new ColumnOptionsBuilder(
        this.tableName,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName
      );
    }
    this.columnName = name;
    this.partialQuery += `${name} SERIAL`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  /**
   * @description If using mysql, it will automatically add BIGINT AUTO_INCREMENT PRIMARY KEY
   * @param name
   */
  bigSerial(name) {
    if (this.sqlType === `mysql`) {
      this.columnName = name;
      this.partialQuery += `${name} BIGINT AUTO_INCREMENT PRIMARY KEY`;
      return new ColumnOptionsBuilder(
        this.tableName,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName
      );
    }
    this.columnName = name;
    this.partialQuery += `${name} BIGSERIAL`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  integer(name) {
    this.columnName = name;
    this.partialQuery += `${name} INT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  bigint(name) {
    this.columnName = name;
    this.partialQuery += `${name} BIGINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  float(name) {
    this.columnName = name;
    this.partialQuery += `${name} FLOAT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  decimal(name) {
    this.columnName = name;
    this.partialQuery += `${name} DECIMAL`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  double(name) {
    this.columnName = name;
    this.partialQuery += `${name} DOUBLE`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  boolean(name) {
    this.columnName = name;
    this.partialQuery += `${name} BOOLEAN`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  date(name) {
    this.columnName = name;
    this.partialQuery += `${name} DATE`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
  timestamp(name) {
    this.columnName = name;
    this.partialQuery += `${name} TIMESTAMP`;
    return new ColumnOptionsBuilder(
      this.tableName,
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
  json(name) {
    this.columnName = name;
    this.partialQuery += `${name} JSON`;
    return new ColumnOptionsBuilder(
      this.tableName,
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
    this.partialQuery += `${name} JSONB`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName
    );
  }
};

// src/Sql/Migrations/Columns/CreateTable/ColumnBuilderConnector.ts
var ColumnBuilderConnector = class {
  constructor(tableName, queryStatements, partialQuery, sqlType) {
    __publicField(this, "tableName");
    __publicField(this, "queryStatements");
    __publicField(this, "partialQuery");
    __publicField(this, "sqlType");
    this.tableName = tableName;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
  }
  newColumn() {
    return new ColumnTypeBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType
    );
  }
};

// src/Sql/Templates/Migration/DROPTABLE.ts
var dropTableTemplate = (tableName, ifExists) => ifExists ? `DROP TABLE IF EXISTS ${tableName}` : `DROP TABLE ${tableName}`;
var DROPTABLE_default = dropTableTemplate;

// src/Sql/Migrations/Columns/AlterTable/ColumnBuilderAlter.ts
var ColumnBuilderAlter = class {
  constructor(tableName, queryStatements, partialQuery, sqlType) {
    __publicField(this, "tableName");
    __publicField(this, "queryStatements");
    __publicField(this, "partialQuery");
    __publicField(this, "sqlType");
    this.tableName = tableName;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
  }
  /**
   * @description Add a new column to the table
   * @param columnName { string }
   * @param dataType { varchar | tinytext | mediumtext | longtext | binary | text | char | tinyint | smallint | mediumint | integer | bigint | float | decimal | double | boolean | date | timestamp | json | jsonb }
   * @param options { afterColumn?: string; references?: { table: string; column: string }; default?: string; primaryKey?: boolean; unique?: boolean; notNullable?: boolean; autoIncrement?: boolean; length?: number; }
   */
  addColumn(columnName, dataType, options) {
    let query = `ALTER TABLE ${this.tableName} ADD COLUMN ${columnName}`;
    if (options?.length) {
      query += ` ${dataType}(${options.length})`;
    } else {
      switch (dataType) {
        case "varchar":
          query += " varchar(255)";
          break;
        case "char":
          query += " char(1)";
          break;
        case "binary":
          query += " binary()";
          break;
        default:
          query += ` ${dataType}`;
      }
    }
    if (options?.notNullable) {
      query += " NOT NULL";
    }
    if (options?.autoIncrement) {
      if (this.sqlType === "mysql") {
        query += " AUTO_INCREMENT";
      } else {
        query += " SERIAL";
      }
    }
    if (options?.default !== void 0) {
      query += ` DEFAULT ${options.default}`;
    }
    if (options?.primaryKey) {
      query += " PRIMARY KEY";
    }
    if (options?.unique) {
      query += " UNIQUE";
    }
    if (options?.references) {
      query += ` REFERENCES ${options.references.table}(${options.references.column})`;
    }
    if (this.sqlType === "mysql" && options?.afterColumn) {
      query += ` AFTER ${options.afterColumn}`;
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
    this.partialQuery = `ALTER TABLE ${this.tableName} ADD COLUMN ${columnName} ENUM(${values.map((value) => `'${value}'`).join(",")})`;
    if (options?.notNullable) {
      this.partialQuery += " NOT NULL";
    }
    if (options?.afterColumn) {
      this.partialQuery += ` AFTER ${options.afterColumn}`;
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
    this.partialQuery = `ALTER TABLE ${this.tableName} DROP COLUMN ${columnName}`;
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
    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} CHANGE ${oldColumnName} ${newColumnName}`;
    } else {
      this.partialQuery = `ALTER TABLE ${this.tableName} RENAME COLUMN ${oldColumnName} TO ${newColumnName}`;
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  modifyColumnType(columnName, newDataType, length) {
    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} MODIFY COLUMN ${columnName} ${newDataType}(${length})`;
    } else {
      this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} TYPE ${newDataType}(${length})`;
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Renames a table
   * @param oldTableName
   * @param newTableName
   */
  renameTable(oldTableName, newTableName) {
    if (this.sqlType === "mysql") {
      this.partialQuery = `RENAME TABLE ${oldTableName} TO ${newTableName}`;
    } else {
      this.partialQuery = `ALTER TABLE ${oldTableName} RENAME TO ${newTableName}`;
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
    this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} SET DEFAULT ${defaultValue}`;
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Drop a default value
   * @param columnName
   */
  dropDefaultValue(columnName) {
    this.partialQuery = `ALTER TABLE ${this.tableName} ALTER COLUMN ${columnName} DROP DEFAULT`;
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
    const fkName = `${this.tableName}_${columnName}_fk`;
    const referencesSQL = `REFERENCES ${options.references.table}(${options.references.column})`;
    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName}) ${referencesSQL}`;
    } else {
      this.partialQuery = `ALTER TABLE ${this.tableName} ADD FOREIGN KEY (${columnName}) ${referencesSQL}`;
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
    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} DROP FOREIGN KEY ${columnName}`;
    } else {
      this.partialQuery = `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS ${this.tableName}_${columnName}_fk`;
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Add a primary key
   * @param columnNames
   */
  addPrimaryKey(columnNames) {
    const pkName = `${this.tableName}_pk`;
    this.partialQuery = `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${pkName} PRIMARY KEY (${columnNames.join(", ")})`;
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Drop a primary key
   */
  dropPrimaryKey() {
    if (this.sqlType === "mysql") {
      this.partialQuery = `ALTER TABLE ${this.tableName} DROP PRIMARY KEY`;
    } else {
      const pkName = `${this.tableName}_pkey`;
      this.partialQuery = `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${pkName}`;
    }
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Add a check constraint - EXPERIMENTAL
   * @param condition
   * @param constraintName
   */
  addCheckConstraint(condition, constraintName) {
    const ckName = constraintName || `${this.tableName}_ck`;
    this.partialQuery = `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${ckName} CHECK (${condition})`;
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description drop a check constraint - EXPERIMENTAL
   * @param constraintName
   */
  dropCheckConstraint(constraintName) {
    this.partialQuery = `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${constraintName}`;
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Add a unique constraint - EXPERIMENTAL
   * @param columnNames
   * @param constraintName
   */
  addUniqueConstraint(columnNames, constraintName) {
    const uqName = constraintName || `${this.tableName}_uq_${columnNames.join("_")}`;
    this.partialQuery = `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${uqName} UNIQUE (${columnNames.join(", ")})`;
    this.queryStatements.push(this.partialQuery);
    this.partialQuery = "";
    return this;
  }
  /**
   * @description Drop a unique constraint - EXPERIMENTAL
   * @param constraintName
   */
  dropUniqueConstraint(constraintName) {
    this.partialQuery = `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${constraintName}`;
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

// src/Sql/Migrations/Schema/Schema.ts
import_dotenv.default.config();
var Schema = class {
  constructor(sqlType) {
    __publicField(this, "queryStatements");
    __publicField(this, "sqlType");
    this.queryStatements = [];
    const dbVendor = process.env.DATABASE_TYPE;
    this.sqlType = dbVendor || sqlType || "mysql";
  }
  rawQuery(query) {
    this.queryStatements.push(query);
  }
  createTable(tableName, options) {
    const partialQuery = options.ifNotExists ? CREATETABLE_default.createTableIfNotExists(tableName) : CREATETABLE_default.createTable(tableName);
    return new ColumnBuilderConnector(
      tableName,
      this.queryStatements,
      partialQuery,
      this.sqlType
    );
  }
  alterTable(tableName) {
    return new ColumnBuilderAlter(
      tableName,
      this.queryStatements,
      "",
      this.sqlType
    );
  }
  dropTable(tableName, ifExists = false) {
    this.rawQuery(DROPTABLE_default(tableName, ifExists));
  }
  truncateTable(tableName) {
    this.rawQuery(`TRUNCATE TABLE ${tableName}`);
  }
};

// src/Sql/Migrations/Migration.ts
var Migration = class {
  constructor() {
    __publicField(this, "migrationName", path.basename(__filename));
    __publicField(this, "schema", new Schema());
  }
};
export {
  BelongsTo,
  HasMany,
  HasOne,
  Migration,
  Model,
  SqlDatasource
};
//# sourceMappingURL=index.mjs.map