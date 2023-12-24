import selectTemplate from "../../Templates/Query/SELECT";
import ModelManagerQueryUtils from "./ModelManagerUtils";
import { log, queryError } from "../../../Logger";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import ModelManagerUtils from "./ModelManagerUtils";
export class ModelManager {
    /**
     * Constructor for ModelManager class.
     *
     * @param {new () => T} model - Model constructor.
     * @param {Pool} mysqlConnection - MySQL connection pool.
     * @param {boolean} logs - Flag to enable or disable logging.
     */
    constructor(model, mysqlConnection, logs) {
        Object.defineProperty(this, "logs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mysqlConnection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.logs = logs;
        this.tableName = model.name;
        this.model = model;
        this.mysqlConnection = mysqlConnection;
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
                const select = selectTemplate(this.tableName);
                log(select.selectAll, this.logs);
                const [rows] = await this.mysqlConnection.query(select.selectAll);
                return rows.map((row) => row) || [];
            }
            const model = new this.model();
            const query = ModelManagerQueryUtils.parseSelectQueryInput(new this.model(), input);
            log(query, this.logs);
            const [rows] = await this.mysqlConnection.query(query);
            return Promise.all(rows.map(async (row) => {
                const modelData = rows[0];
                // merge model data into model
                Object.assign(model, modelData);
                // relations parsing on the queried model
                await ModelManagerUtils.parseRelationInput(model, input, this.mysqlConnection, this.logs);
                return model;
            }));
        }
        catch (error) {
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
            const query = ModelManagerQueryUtils.parseSelectQueryInput(model, input);
            log(query, this.logs);
            const [rows] = await this.mysqlConnection.query(query);
            const modelData = rows[0];
            // merge model data into model
            Object.assign(model, modelData);
            // relations parsing on the queried model
            await ModelManagerUtils.parseRelationInput(model, input, this.mysqlConnection, this.logs);
            return model;
        }
        catch (error) {
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
        const select = selectTemplate(this.tableName);
        try {
            const stringedId = typeof id === "number" ? id.toString() : id;
            const query = select.selectById(stringedId);
            log(query, this.logs);
            const [rows] = await this.mysqlConnection.query(query);
            return rows[0];
        }
        catch (error) {
            queryError(error);
            throw new Error("Query failed " + error);
        }
    }
    /**
     * Save a new model instance to the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @returns Promise resolving to the saved model or null if saving fails.
     */
    async save(model) {
        try {
            const insertQuery = ModelManagerQueryUtils.parseInsert(model);
            log(insertQuery, this.logs);
            const [rows] = await this.mysqlConnection.query(insertQuery);
            return (await this.findOneById(rows.insertId)) || null;
        }
        catch (error) {
            queryError(error);
            throw new Error("Query failed " + error);
        }
    }
    /**
     * Update an existing model instance in the database.
     * @param {Model} model - Model instance to be updated.
     * @returns Promise resolving to the updated model or null if updating fails.
     */
    async update(model) {
        try {
            const updateQuery = ModelManagerQueryUtils.parseUpdate(model);
            log(updateQuery, this.logs);
            const [rows] = await this.mysqlConnection.query(updateQuery);
            if (!model.metadata.primaryKey) {
                return null;
            }
            return await this.findOneById(model.metadata["primaryKey"]);
        }
        catch (error) {
            queryError(error);
            throw new Error("Query failed " + error);
        }
    }
    /**
     * @description Delete a record from the database from the given column and value.
     *
     * @param {string} column - Column to filter by.
     * @param {string | number | boolean} value - Value to filter by.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    async deleteByColumn(column, value) {
        try {
            const deleteQuery = ModelManagerQueryUtils.parseDelete(this.tableName, column, value);
            log(deleteQuery, this.logs);
            const [rows] = await this.mysqlConnection.query(deleteQuery);
            return rows[0];
        }
        catch (error) {
            queryError(error);
            throw new Error("Query failed " + error);
        }
    }
    /**
     * @description Delete a record from the database from the given model.
     *
     * @param {Model} model - Model to delete.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    async delete(model) {
        try {
            if (!model.metadata.primaryKey) {
                throw new Error("Model " +
                    model.metadata.tableName +
                    " has no primary key to be deleted from, try deleteByColumn");
            }
            const deleteQuery = ModelManagerQueryUtils.parseDelete(this.tableName, model.metadata.primaryKey, model.metadata["primaryKey"]);
            log(deleteQuery, this.logs);
            await this.mysqlConnection.query(deleteQuery);
            return model;
        }
        catch (error) {
            queryError(error);
            throw new Error("Query failed " + error);
        }
    }
    /**
     * Create and return a new instance of the QueryBuilder for building more complex SQL queries.
     *
     * @returns {QueryBuilder<Model>} - Instance of QueryBuilder.
     */
    queryBuilder() {
        return new QueryBuilder(this.model, this.tableName, this.mysqlConnection, this.logs);
    }
    /**
     * @description Starts a transaction
     */
    async startTransaction() {
        return await this.mysqlConnection.beginTransaction();
    }
    /**
     * @description Commits a transaction
     */
    async commitTransaction() {
        return await this.mysqlConnection.commit();
    }
    /**
     * @description Rollbacks a transaction
     */
    async rollbackTransaction() {
        return await this.mysqlConnection.rollback();
    }
}