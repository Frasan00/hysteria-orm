import selectTemplate from "../../Templates/Query/SELECT";
import { log } from "../../../Logger";
import ModelManagerUtils from "../ModelManager/ModelManagerUtils";
import whereTemplate from "../../Templates/Query/WHERE.TS";
export class QueryBuilder {
    /**
     * @description Constructs a QueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param mysqlConnection - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     */
    constructor(model, tableName, mysqlConnection, logs) {
        Object.defineProperty(this, "selectQuery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "relations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "whereQuery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "groupByQuery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "orderByQuery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "limitQuery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "offsetQuery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
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
        Object.defineProperty(this, "mysqlConnection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "selectTemplate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "whereTemplate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.model = model;
        this.mysqlConnection = mysqlConnection;
        this.logs = logs;
        this.tableName = tableName;
        this.selectQuery = selectTemplate(this.tableName).selectAll;
        this.selectTemplate = selectTemplate(this.tableName);
        this.whereTemplate = whereTemplate(this.tableName);
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
            // merge model data into model
            Object.assign(model, modelData);
            // relations parsing on the queried model
            await ModelManagerUtils.parseQueryBuilderRelations(model, this.relations, this.mysqlConnection, this.logs);
            return model;
        }
        catch (error) {
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
            return Promise.all(rows.map(async (row) => {
                const modelData = rows[0];
                // merge model data into model
                Object.assign(model, modelData);
                // relations parsing on the queried model
                await ModelManagerUtils.parseQueryBuilderRelations(model, this.relations, this.mysqlConnection, this.logs);
                return model;
            }));
        }
        catch (error) {
            throw new Error("Query failed " + error);
        }
    }
    /**
     * @description Columns are customizable with aliases. By default, without this function, all columns are selected
     * @param columns
     */
    select(...columns) {
        const select = selectTemplate(this.tableName);
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
            this.whereQuery += this.whereTemplate.andWhere(column, value.toString(), operator);
            return this;
        }
        this.whereQuery = this.whereTemplate.where(column, value.toString(), operator);
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
            this.whereQuery = this.whereTemplate.where(column, value.toString(), operator);
            return this;
        }
        this.whereQuery += whereTemplate(this.tableName).andWhere(column, value.toString(), operator);
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
            this.whereQuery = this.whereTemplate.where(column, value.toString(), operator);
            return this;
        }
        this.whereQuery += whereTemplate(this.tableName).orWhere(column, value.toString(), operator);
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
        this.whereQuery += whereTemplate(this.tableName).whereBetween(column, min, max);
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
        this.whereQuery += whereTemplate(this.tableName).andWhereBetween(column, min, max);
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
        this.whereQuery += whereTemplate(this.tableName).orWhereBetween(column, min, max);
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
        this.whereQuery += whereTemplate(this.tableName).whereNotBetween(column, min, max);
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
        this.whereQuery += whereTemplate(this.tableName).orWhereNotBetween(column, min, max);
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
        this.whereQuery += whereTemplate(this.tableName).whereIn(column, values);
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
        this.whereQuery += whereTemplate(this.tableName).andWhereIn(column, values);
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
        this.whereQuery += whereTemplate(this.tableName).orWhereIn(column, values);
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
        this.whereQuery += whereTemplate(this.tableName).whereNotIn(column, values);
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
        this.whereQuery += whereTemplate(this.tableName).orWhereNotIn(column, values);
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
        this.whereQuery += whereTemplate(this.tableName).whereNull(column);
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
        this.whereQuery += whereTemplate(this.tableName).andWhereNull(column);
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
        this.whereQuery += whereTemplate(this.tableName).orWhereNull(column);
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
        this.whereQuery += whereTemplate(this.tableName).whereNotNull(column);
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
        this.whereQuery += whereTemplate(this.tableName).andWhereNotNull(column);
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
        this.whereQuery += whereTemplate(this.tableName).orWhereNotNull(column);
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
        this.whereQuery += whereTemplate(this.tableName).rawWhere(query);
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
        this.whereQuery += whereTemplate(this.tableName).rawAndWhere(query);
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
        this.whereQuery += whereTemplate(this.tableName).rawOrWhere(query);
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
        return (this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery);
    }
}
