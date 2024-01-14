var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/Mysql/Models/Model.ts
var Model = class {
  constructor(tableName, primaryKey) {
    __publicField(this, "metadata");
    this.metadata = {
      tableName: tableName || this.constructor.name,
      primaryKey
    };
  }
};

// src/Mysql/Models/Relations/Relation.ts
var Relation = class {
  constructor(relatedModel) {
    __publicField(this, "foreignKey");
    __publicField(this, "relatedModel");
    this.relatedModel = relatedModel;
  }
};

// src/Mysql/Models/Relations/HasOne.ts
var HasOne = class extends Relation {
  constructor(relatedModel, foreignKey) {
    super(relatedModel);
    __publicField(this, "type");
    __publicField(this, "foreignKey");
    this.foreignKey = foreignKey;
    this.type = "hasOne" /* hasOne */;
  }
};

// src/Mysql/Models/Relations/HasMany.ts
var HasMany = class extends Relation {
  constructor(relatedModel, foreignKey) {
    super(relatedModel);
    __publicField(this, "type", "hasMany" /* hasMany */);
    __publicField(this, "foreignKey");
    this.foreignKey = foreignKey;
    this.type = "hasMany" /* hasMany */;
  }
};

// src/Mysql/Models/Relations/BelongsTo.ts
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

// src/Mysql/MysqlDatasource.ts
import { createPool } from "mysql2/promise";

// src/Mysql/Templates/Query/SELECT.ts
var selectTemplate = (table) => {
  return {
    selectAll: `SELECT * FROM ${table} `,
    selectById: (id) => `SELECT * FROM ${table} WHERE id = ${id} `,
    selectColumns: (...columns) => `SELECT ${columns.join(", ")} FROM ${table} `,
    selectCount: `SELECT COUNT(*) FROM ${table} `,
    selectDistinct: (...columns) => `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `,
    selectSum: (column) => `SELECT SUM(${column}) FROM ${table} `,
    orderBy: (column, order) => `
ORDER BY ${column.join(", ")} ${order}`,
    groupBy: (...columns) => `
GROUP BY ${columns.join(", ")} `,
    limit: (limit) => `
LIMIT ${limit} `,
    offset: (offset) => `
OFFSET ${offset} `
  };
};
var SELECT_default = selectTemplate;

// src/Mysql/Templates/Query/INSERT.ts
var insertTemplate = (tableName) => {
  return {
    insert: (columns, values) => {
      values = parseValues(values);
      return `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES (${values.join(", ")});`;
    },
    insertMany: (columns, values) => {
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
    return value || "DEFAULT";
  });
}
var INSERT_default = insertTemplate;

// src/Mysql/Templates/Query/UPDATE.ts
var updateTemplate = (table) => {
  return {
    update: (columns, values, primaryKey, primaryKeyValue) => `UPDATE ${table} SET ${columns.map((column, index) => parseColumnValue(column, values[index])).join(", ")} WHERE ${primaryKey} = ${primaryKeyValue};`
  };
};
function parseColumnValue(column, value) {
  if (typeof value === "string") {
    return `${column} = '${value}'`;
  }
  return `${column} = ${value}`;
}
var UPDATE_default = updateTemplate;

// src/Mysql/Templates/Query/DELETE.ts
var deleteTemplate = (tableName) => {
  return {
    delete: (column, value) => `
DELETE FROM ${tableName} WHERE ${column} = ${value} `
  };
};
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

// src/Mysql/Templates/Query/RELATIONS.ts
function relationTemplates(model, relation) {
  const primaryKey = model.metadata.primaryKey;
  switch (relation.type) {
    case "hasOne" /* hasOne */:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${relation.foreignKey} = ${model[primaryKey]} LIMIT 1;`;
    case "belongsTo" /* belongsTo */:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.id = ${model[relation.foreignKey]};`;
    case "hasMany" /* hasMany */:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${relation.foreignKey} = ${model[primaryKey]};`;
    default:
      return "";
  }
}
var RELATIONS_default = relationTemplates;

// src/Mysql/Templates/Query/WHERE.TS.ts
var whereTemplate = (tableName) => {
  return {
    where: (column, value, operator = "=") => `
WHERE ${tableName}.${column} = ${value} `,
    andWhere: (column, value, operator = "=") => ` AND ${tableName}.${column} = ${value} `,
    orWhere: (column, value, operator = "=") => ` OR ${tableName}.${column} = ${value} `,
    whereNot: (column, value) => `
WHERE ${tableName}.${column} != ${value} `,
    andWhereNot: (column, value) => ` AND ${tableName}.${column} != ${value} `,
    orWhereNot: (column, value) => ` OR ${tableName}.${column} != ${value} `,
    whereNull: (column) => `
WHERE ${tableName}.${column} IS NULL `,
    andWhereNull: (column) => ` AND ${tableName}.${column} IS NULL `,
    orWhereNull: (column) => ` OR ${tableName}.${column} IS NULL `,
    whereNotNull: (column) => `
WHERE ${tableName}.${column} IS NOT NULL `,
    andWhereNotNull: (column) => ` AND ${tableName}.${column} IS NOT NULL `,
    orWhereNotNull: (column) => ` OR ${tableName}.${column} IS NOT NULL `,
    whereBetween: (column, min, max) => `
WHERE ${tableName}.${column} BETWEEN ${min} AND ${max} `,
    andWhereBetween: (column, min, max) => ` AND ${tableName}.${column} BETWEEN ${min} AND ${max} `,
    orWhereBetween: (column, min, max) => ` OR ${tableName}.${column} BETWEEN ${min} AND ${max} `,
    whereNotBetween: (column, min, max) => `
WHERE ${tableName}.${column} NOT BETWEEN ${min} AND ${max} `,
    andWhereNotBetween: (column, min, max) => ` AND ${tableName}.${column} NOT BETWEEN ${min} AND ${max} `,
    orWhereNotBetween: (column, min, max) => ` OR ${tableName}.${column} NOT BETWEEN ${min} AND ${max} `,
    whereIn: (column, values) => `
WHERE ${tableName}.${column} IN (${values.join(", ")}) `,
    andWhereIn: (column, values) => ` AND ${tableName}.${column} IN (${values.join(", ")}) `,
    orWhereIn: (column, values) => ` OR ${tableName}.${column} IN (${values.join(", ")}) `,
    whereNotIn: (column, values) => `
WHERE ${tableName}.${column} NOT IN (${values.join(", ")}) `,
    andWhereNotIn: (column, values) => ` AND ${tableName}.${column} NOT IN (${values.join(", ")}) `,
    orWhereNotIn: (column, values) => ` OR ${tableName}.${column} NOT IN (${values.join(", ")}) `,
    rawWhere: (query) => `
WHERE ${query} `,
    rawAndWhere: (query) => ` AND ${query} `,
    rawOrWhere: (query) => ` OR ${query} `
  };
};
var WHERE_TS_default = whereTemplate;

// src/Mysql/Models/ModelManager/ModelManagerUtils.ts
var ModelManagerUtils = class {
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
var ModelManagerUtils_default = new ModelManagerUtils();

// src/Mysql/Models/QueryBuilder/QueryBuilder.ts
var QueryBuilder = class {
  /**
   * @description Constructs a QueryBuilder instance.
   * @param model - The model class associated with the table.
   * @param tableName - The name of the table.
   * @param mysqlConnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   */
  constructor(model, tableName, mysqlConnection, logs) {
    __publicField(this, "selectQuery", "");
    __publicField(this, "relations", []);
    __publicField(this, "whereQuery", "");
    __publicField(this, "groupByQuery", "");
    __publicField(this, "orderByQuery", "");
    __publicField(this, "limitQuery", "");
    __publicField(this, "offsetQuery", "");
    __publicField(this, "model");
    __publicField(this, "tableName");
    __publicField(this, "mysqlConnection");
    __publicField(this, "logs");
    __publicField(this, "selectTemplate");
    __publicField(this, "whereTemplate");
    this.model = model;
    this.mysqlConnection = mysqlConnection;
    this.logs = logs;
    this.tableName = tableName;
    this.selectQuery = SELECT_default(this.tableName).selectAll;
    this.selectTemplate = SELECT_default(this.tableName);
    this.whereTemplate = WHERE_TS_default(this.tableName);
  }
  /**
   * @description Executes the query and retrieves the first result.
   * @returns A Promise resolving to the first result or null.
   */
  async one() {
    let query = this.selectQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    log(query, this.logs);
    const model = new this.model();
    try {
      const [rows] = await this.mysqlConnection.query(query);
      const modelData = rows[0];
      Object.assign(model, modelData);
      await ModelManagerUtils_default.parseQueryBuilderRelations(
        model,
        this.relations,
        this.mysqlConnection,
        this.logs
      );
      return model;
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Executes the query and retrieves multiple results.
   * @returns A Promise resolving to an array of results.
   */
  async many() {
    let query = this.selectQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query += this.groupFooterQuery();
    log(query, this.logs);
    const model = new this.model();
    try {
      const [rows] = await this.mysqlConnection.query(query);
      return Promise.all(
        rows.map(async (row) => {
          const modelData = rows[0];
          Object.assign(model, modelData);
          await ModelManagerUtils_default.parseQueryBuilderRelations(
            model,
            this.relations,
            this.mysqlConnection,
            this.logs
          );
          return model;
        })
      );
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Columns are customizable with aliases. By default, without this function, all columns are selected
   * @param columns
   */
  select(...columns) {
    const select = SELECT_default(this.tableName);
    this.selectQuery = select.selectColumns(...columns);
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
   * @returns The QueryBuilder instance for chaining.
   */
  where(column, operator, value) {
    if (this.whereQuery) {
      this.whereQuery += this.whereTemplate.andWhere(
        column,
        value.toString(),
        operator
      );
      return this;
    }
    this.whereQuery = this.whereTemplate.where(
      column,
      value.toString(),
      operator
    );
    return this;
  }
  /**
   * @description Adds an AND WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The QueryBuilder instance for chaining.
   */
  andWhere(column, operator, value) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(
        column,
        value.toString(),
        operator
      );
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).andWhere(
      column,
      value.toString(),
      operator
    );
    return this;
  }
  /**
   * @description Adds an OR WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The QueryBuilder instance for chaining.
   */
  orWhere(column, operator, value) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(
        column,
        value.toString(),
        operator
      );
      return this;
    }
    this.whereQuery += WHERE_TS_default(this.tableName).orWhere(
      column,
      value.toString(),
      operator
    );
    return this;
  }
  /**
   * @description Adds a WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
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
   * @returns The QueryBuilder instance for chaining.
   */
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  /**
   * @description Adds ORDER BY conditions to the query.
   * @param column - The column to order by.
   * @param order - The order direction, either "ASC" or "DESC".
   * @returns The QueryBuilder instance for chaining.
   */
  orderBy(column, order) {
    this.orderByQuery = this.selectTemplate.orderBy(column, order);
    return this;
  }
  /**
   * @description Adds a LIMIT condition to the query.
   * @param limit - The maximum number of rows to return.
   * @returns The QueryBuilder instance for chaining.
   */
  limit(limit) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }
  /**
   * @description Adds an OFFSET condition to the query.
   * @param offset - The number of rows to skip.
   * @returns The QueryBuilder instance for chaining.
   */
  offset(offset) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }
  groupFooterQuery() {
    return this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
  }
};

// src/Mysql/Templates/Query/TRANSACTION.ts
var BEGIN_TRANSACTION = "START TRANSACTION; \n";
var COMMIT_TRANSACTION = "COMMIT; \n";
var ROLLBACK_TRANSACTION = "ROLLBACK; \n";

// src/Mysql/Transaction/Transaction.ts
var Transaction = class {
  constructor(mysql, tableName, logs) {
    __publicField(this, "tableName");
    __publicField(this, "mysql");
    __publicField(this, "mysqlConnection");
    __publicField(this, "logs");
    this.logs = logs;
    this.mysql = mysql;
    this.tableName = tableName;
  }
  async queryInsert(query, metadata, params) {
    if (!this.mysqlConnection) {
      throw new Error("Transaction not started.");
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
      throw new Error("Transaction not started.");
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
      throw new Error("Transaction not started.");
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
      throw new Error("Transaction not started.");
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

// src/Mysql/Models/ModelManager/ModelManager.ts
var ModelManager = class {
  /**
   * Constructor for ModelManager class.
   *
   * @param {new () => T} model - Model constructor.
   * @param {Pool} mysqlConnection - MySQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model, mysqlConnection, logs) {
    __publicField(this, "logs");
    __publicField(this, "mysqlPool");
    __publicField(this, "model");
    __publicField(this, "modelInstance");
    __publicField(this, "tableName");
    this.logs = logs;
    this.tableName = model.name;
    this.model = model;
    this.modelInstance = new this.model();
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
        return rows2.map((row) => row) || [];
      }
      const model = new this.model();
      const query = ModelManagerUtils_default.parseSelectQueryInput(
        new this.model(),
        input
      );
      log(query, this.logs);
      const [rows] = await this.mysqlPool.query(query);
      return Promise.all(
        rows.map(async (row) => {
          const modelData = rows[0];
          Object.assign(model, modelData);
          await ModelManagerUtils_default.parseRelationInput(
            model,
            input,
            this.mysqlPool,
            this.logs
          );
          return model;
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
      const query = ModelManagerUtils_default.parseSelectQueryInput(model, input);
      log(query, this.logs);
      const [rows] = await this.mysqlPool.query(query);
      const modelData = rows[0];
      Object.assign(model, modelData);
      await ModelManagerUtils_default.parseRelationInput(
        model,
        input,
        this.mysqlPool,
        this.logs
      );
      return model;
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
      return rows[0];
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {Transaction} trx - Transaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  async save(model, trx) {
    if (trx) {
      return await trx.queryInsert(
        ModelManagerUtils_default.parseInsert(model),
        this.modelInstance.metadata
      );
    }
    try {
      const insertQuery = ModelManagerUtils_default.parseInsert(model);
      log(insertQuery, this.logs);
      const [rows] = await this.mysqlPool.query(insertQuery);
      return await this.findOneById(rows[0].insertId) || null;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {Transaction} trx - Transaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async update(model, trx) {
    if (trx) {
      const primaryKeyValue = model["metadata"]["primaryKey"];
      return await trx.queryUpdate(
        ModelManagerUtils_default.parseUpdate(model)
      );
    }
    try {
      const updateQuery = ModelManagerUtils_default.parseUpdate(model);
      log(updateQuery, this.logs);
      const [rows] = await this.mysqlPool.query(updateQuery);
      return rows.affectedRows;
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
   * @param {Transaction} trx - Transaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteByColumn(column, value, trx) {
    if (trx) {
      return await trx.queryDelete(
        ModelManagerUtils_default.parseDelete(this.tableName, column, value)
      );
    }
    try {
      const deleteQuery = ModelManagerUtils_default.parseDelete(
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
   * @param {Transaction} trx - Transaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async delete(model, trx) {
    try {
      if (!model.metadata.primaryKey) {
        throw new Error(
          "Model " + model.metadata.tableName + " has no primary key to be deleted from, try deleteByColumn"
        );
      }
      const deleteQuery = ModelManagerUtils_default.parseDelete(
        this.tableName,
        model.metadata.primaryKey,
        model.metadata["primaryKey"]
      );
      if (trx) {
        return await trx.queryDelete(deleteQuery);
      }
      log(deleteQuery, this.logs);
      const [rows] = await this.mysqlPool.query(deleteQuery);
      return rows.affectedRows;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }
  /**
   * @description Creates a new transaction.
   * @returns {Transaction} - Instance of Transaction.
   */
  createTransaction() {
    return new Transaction(this.mysqlPool, this.tableName, this.logs);
  }
  /**
   * Create and return a new instance of the QueryBuilder for building more complex SQL queries.
   *
   * @returns {QueryBuilder<Model>} - Instance of QueryBuilder.
   */
  queryBuilder() {
    return new QueryBuilder(
      this.model,
      this.tableName,
      this.mysqlPool,
      this.logs
    );
  }
};

// src/Mysql/MysqlDatasource.ts
var MysqlDatasource = class extends Datasource {
  constructor(input) {
    super(input);
    __publicField(this, "pool");
    __publicField(this, "connection");
    __publicField(this, "migrationsPath");
    this.migrationsPath = input.migrationsPath;
  }
  /**
   * @description Connects to the database establishing a connection pool.
   */
  async connect() {
    this.pool = createPool({
      host: this.host,
      port: this.port,
      user: this.username,
      password: this.password,
      database: this.database
    });
  }
  /**
   * @description Returns raw mysql pool
   */
  async getRawPool() {
    return createPool({
      host: this.host,
      port: this.port,
      user: this.username,
      password: this.password,
      database: this.database
    });
  }
  /**
   * @description Returns raw mysql PoolConnection
   */
  async getRawPoolConnection() {
    return createPool({
      host: this.host,
      port: this.port,
      user: this.username,
      password: this.password,
      database: this.database
    }).getConnection();
  }
  /**
   * @description Returns model manager for the provided model
   * @param model
   */
  getModelManager(model) {
    return new ModelManager(model, this.pool, this.logs);
  }
};

// src/Mysql/Migrations/Columns/Column.ts
var Column = class {
  constructor() {
    __publicField(this, "name");
    __publicField(this, "oldName");
    // used for alter table
    __publicField(this, "type");
    __publicField(this, "values");
    __publicField(this, "length");
    __publicField(this, "alter");
    // used for alter table
    __publicField(this, "after");
    // used for alter table
    __publicField(this, "config", {
      nullable: true,
      unique: false,
      autoIncrement: false,
      primary: false,
      defaultValue: false,
      autoCreate: false,
      autoUpdate: false,
      references: void 0,
      unsigned: false,
      cascade: false
    });
  }
  getColumn() {
    return this;
  }
};

// src/Mysql/Migrations/Columns/DropColumn.ts
var DropColumn = class {
  constructor(name, foreignKey = false) {
    __publicField(this, "name");
    __publicField(this, "foreignKey");
    this.name = name;
    this.foreignKey = foreignKey;
  }
  getColumn() {
    return this;
  }
};

// src/Mysql/Migrations/Columns/ColumnBuilders/ColumnConfigBuilder.ts
var ColumnConfigBuilder = class {
  constructor(column, table, migrationType) {
    __publicField(this, "column");
    __publicField(this, "table");
    __publicField(this, "migrationType");
    this.column = column;
    this.table = table;
    this.migrationType = migrationType;
  }
  nullable() {
    this.column.config.nullable = true;
    return this;
  }
  notNullable() {
    this.column.config.nullable = false;
    return this;
  }
  unique() {
    this.column.config.unique = true;
    return this;
  }
  autoIncrement() {
    this.column.config.autoIncrement = true;
    return this;
  }
  primary() {
    this.column.config.primary = true;
    return this;
  }
  cascade() {
    this.column.config.cascade = true;
    return this;
  }
  defaultValue(value) {
    this.column.config.defaultValue = value;
    return this;
  }
  autoCreate() {
    this.column.config.autoCreate = true;
    return this;
  }
  autoUpdate() {
    this.column.config.autoUpdate = true;
    return this;
  }
  references(table, column) {
    this.column.config.references = {
      table,
      column
    };
    return this;
  }
  unsigned() {
    this.column.config.unsigned = true;
    return this;
  }
  commit() {
    switch (this.migrationType) {
      case "create":
        this.table.columnsToAdd.push(this.column);
        break;
      case "alter":
        this.table.columnsToAlter.push(this.column);
        break;
    }
  }
  alter() {
    this.column.alter = true;
    return this;
  }
  after(columnName) {
    this.column.after = columnName;
    return this;
  }
};

// src/Mysql/Migrations/Columns/ColumnBuilders/ColumnTypeBuilder.ts
var ColumnTypeBuilder = class {
  constructor(column, table, migrationType) {
    __publicField(this, "column");
    __publicField(this, "table");
    __publicField(this, "migrationType");
    this.column = column;
    this.table = table;
    this.migrationType = migrationType;
  }
  string(name, length = 100) {
    this.column.name = name;
    this.column.type = "VARCHAR";
    this.column.length = length;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  text(name) {
    this.column.name = name;
    this.column.type = "TEXT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  int(name, length = 100) {
    this.column.name = name;
    this.column.type = "INT";
    this.column.length = length;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  bigInt(name) {
    this.column.name = name;
    this.column.type = "BIGINT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  float(name) {
    this.column.name = name;
    this.column.type = "FLOAT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  double(name) {
    this.column.name = name;
    this.column.type = "DOUBLE";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  decimal(name) {
    this.column.name = name;
    this.column.type = "DECIMAL";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  boolean(name) {
    this.column.name = name;
    this.column.type = "BOOLEAN";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  date(name) {
    this.column.name = name;
    this.column.type = "DATE";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  dateTime(name) {
    this.column.name = name;
    this.column.type = "DATETIME";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  time(name) {
    this.column.name = name;
    this.column.type = "TIME";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  timestamp(name) {
    this.column.name = name;
    this.column.type = "TIMESTAMP";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  bit(name) {
    this.column.name = name;
    this.column.type = "BIT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  enum(name, values) {
    this.column.name = name;
    this.column.type = "ENUM";
    this.column.values = values;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  set(name, values) {
    this.column.name = name;
    this.column.type = "SET";
    this.column.values = values;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  uuid(name) {
    this.column.name = name;
    this.column.type = "UUID";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  char(name) {
    this.column.name = name;
    this.column.type = "CHAR";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  tinyText(name) {
    this.column.name = name;
    this.column.type = "TINYTEXT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  mediumText(name) {
    this.column.name = name;
    this.column.type = "MEDIUMTEXT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  longText(name) {
    this.column.name = name;
    this.column.type = "LONGTEXT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  tinyInteger(name) {
    this.column.name = name;
    this.column.type = "TINYINT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  smallInteger(name) {
    this.column.name = name;
    this.column.type = "SMALLINT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  mediumInteger(name) {
    this.column.name = name;
    this.column.type = "MEDIUMINT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  renameColumn(oldName, newName) {
    this.column.oldName = oldName;
    this.column.name = newName;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  commit() {
    switch (this.migrationType) {
      case "create":
        this.table.columnsToAdd.push(this.column);
        break;
      case "alter":
        this.table.columnsToAlter.push(this.column);
        break;
    }
  }
  alter() {
    this.column.alter = true;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }
  after(columnName) {
    this.column.after = columnName;
    return this;
  }
};

// src/Mysql/Migrations/Table.ts
var Table = class {
  constructor(tableName, migrationType) {
    __publicField(this, "tableName");
    __publicField(this, "columnsToAdd", []);
    __publicField(this, "columnsToAlter", []);
    __publicField(this, "columnsToDelete", []);
    __publicField(this, "dropTable", false);
    __publicField(this, "truncateTable", false);
    __publicField(this, "migrationType");
    this.tableName = tableName;
    this.migrationType = migrationType;
  }
  column() {
    const column = new Column();
    return new ColumnTypeBuilder(column, this, this.migrationType);
  }
  dropColumn(columnName, foreignKey) {
    const column = new DropColumn(columnName, foreignKey);
    this.columnsToDelete.push(column);
  }
  drop() {
    this.dropTable = true;
  }
  truncate() {
    this.truncateTable = true;
  }
};

// src/Mysql/Migrations/Migration.ts
import path from "path";
var Migration = class {
  constructor() {
    __publicField(this, "migrationName", path.basename(__filename));
    __publicField(this, "tableName");
    __publicField(this, "migrationType");
    __publicField(this, "table");
    __publicField(this, "rawQuery", "");
  }
  /**
   * @description Use this method to manage a table in your database (create, alter, drop)
   * @param tableName
   * @param migrationType
   */
  useTable(tableName, migrationType) {
    this.tableName = tableName;
    this.migrationType = migrationType;
    this.table = new Table(this.tableName, this.migrationType);
  }
  /**
   * @description Use this method to run a raw query in your database
   * @param query
   */
  useRawQuery(query) {
    this.migrationType = "rawQuery";
    this.rawQuery = query;
  }
};
export {
  BelongsTo,
  HasMany,
  HasOne,
  Migration,
  Model,
  MysqlDatasource
};
//# sourceMappingURL=index.mjs.map