import mysql, { Pool as Pool$1, PoolConnection } from 'mysql2/promise';
import pg, { Pool, PoolClient } from 'pg';

interface Metadata {
    readonly tableName: string;
    readonly primaryKey?: string;
}
declare abstract class Model {
    metadata: Metadata;
    aliasColumns: {
        [key: string]: string | number | boolean;
    };
    protected constructor(tableName?: string, primaryKey?: string);
    setProps<T extends this>(data: Partial<T>): void;
}

declare enum RelationType {
    hasOne = "hasOne",// One to One without foreign key
    belongsTo = "belongsTo",// One to One with foreign key
    hasMany = "hasMany"
}
/**
 * Main Model -> Related Model
 */
declare abstract class Relation {
    abstract type: RelationType;
    foreignKey?: string;
    relatedModel: string;
    protected constructor(relatedModel: string);
}

declare class HasOne extends Relation {
    type: RelationType;
    foreignKey: string;
    constructor(relatedModel: string, foreignKey: string);
}

declare class HasMany extends Relation {
    type: RelationType;
    foreignKey: string;
    constructor(relatedModel: string, foreignKey: string);
}

declare class BelongsTo extends Relation {
    type: RelationType;
    foreignKey: string;
    constructor(relatedModel: string, foreignKey: string);
}

type WhereType = {
    [key: string]: string | number | boolean;
};
type OrderByType = {
    columns: string[];
    type: "ASC" | "DESC";
};
type FindOneType = {
    select?: string[];
    relations?: string[];
    where?: WhereType;
};
type FindType = FindOneType & {
    orderBy?: OrderByType;
    groupBy?: string[];
    limit?: number;
    offset?: number;
};

type WhereOperatorType = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE";
type BaseValues = string | number | boolean | Date;
type WhereTemplateType = {
    where: (column: string, value: BaseValues, operator: WhereOperatorType) => string;
    andWhere: (column: string, value: BaseValues, operator: WhereOperatorType) => string;
    orWhere: (column: string, value: BaseValues, operator: WhereOperatorType) => string;
    whereNot: (column: string, value: BaseValues) => string;
    andWhereNot: (column: string, value: BaseValues) => string;
    orWhereNot: (column: string, value: BaseValues) => string;
    whereNull: (column: string) => string;
    andWhereNull: (column: string) => string;
    orWhereNull: (column: string) => string;
    whereNotNull: (column: string) => string;
    andWhereNotNull: (column: string) => string;
    orWhereNotNull: (column: string) => string;
    whereBetween: (column: string, min: BaseValues, max: BaseValues) => string;
    andWhereBetween: (column: string, min: BaseValues, max: BaseValues) => string;
    orWhereBetween: (column: string, min: BaseValues, max: BaseValues) => string;
    whereNotBetween: (column: string, min: BaseValues, max: BaseValues) => string;
    andWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => string;
    orWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => string;
    whereIn: (column: string, values: BaseValues[]) => string;
    andWhereIn: (column: string, values: BaseValues[]) => string;
    orWhereIn: (column: string, values: BaseValues[]) => string;
    whereNotIn: (column: string, values: BaseValues[]) => string;
    andWhereNotIn: (column: string, values: BaseValues[]) => string;
    orWhereNotIn: (column: string, values: BaseValues[]) => string;
    rawWhere: (query: string) => string;
    rawAndWhere: (query: string) => string;
    rawOrWhere: (query: string) => string;
};

type SelectTemplateType = {
    selectAll: string;
    selectById: (id: string) => string;
    selectColumns: (...columns: string[]) => string;
    selectCount: string;
    selectDistinct: (...columns: string[]) => string;
    selectSum: (column: string) => string;
    orderBy: (column: string[], order?: "ASC" | "DESC") => string;
    groupBy: (...columns: string[]) => string;
    limit: (limit: number) => string;
    offset: (offset: number) => string;
};

type PaginationMetadata = {
    perPage: number;
    currentPage: number;
    firstPage: number;
    isEmpty: boolean;
    total: number;
    hasTotal: boolean;
    lastPage: number;
    hasMorePages: boolean;
    hasPages: boolean;
};

declare class PostgresQueryBuilder<T extends Model> extends QueryBuilder<T> {
    protected pgPool: Pool;
    constructor(model: new () => T, tableName: string, pgPool: Pool, logs: boolean);
    private mergeRetrievedDataIntoModel;
    one(): Promise<T | null>;
    many(): Promise<T[]>;
    /**
     * @description Paginates the query results with the given page and limit.
     * @param page
     * @param limit
     */
    paginate(page: number, limit: number): Promise<{
        paginationMetadata: PaginationMetadata;
        data: T[];
    }>;
    select(...columns: string[]): PostgresQueryBuilder<T>;
    addRelations(relations: string[]): PostgresQueryBuilder<T>;
    where(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): PostgresQueryBuilder<T>;
    andWhere(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): PostgresQueryBuilder<T>;
    andWhereBetween(column: string, min: string, max: string): PostgresQueryBuilder<T>;
    andWhereIn(column: string, values: string[]): PostgresQueryBuilder<T>;
    andWhereNotNull(column: string): PostgresQueryBuilder<T>;
    andWhereNull(column: string): PostgresQueryBuilder<T>;
    groupBy(columns: string): PostgresQueryBuilder<T>;
    limit(limit: number): PostgresQueryBuilder<T>;
    offset(offset: number): PostgresQueryBuilder<T>;
    orWhere(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): PostgresQueryBuilder<T>;
    orWhereBetween(column: string, min: string, max: string): PostgresQueryBuilder<T>;
    orWhereIn(column: string, values: string[]): PostgresQueryBuilder<T>;
    orWhereNotBetween(column: string, min: string, max: string): PostgresQueryBuilder<T>;
    orWhereNotIn(column: string, values: string[]): PostgresQueryBuilder<T>;
    orWhereNotNull(column: string): PostgresQueryBuilder<T>;
    orWhereNull(column: string): PostgresQueryBuilder<T>;
    orderBy(column: string[], order: "ASC" | "DESC"): PostgresQueryBuilder<T>;
    rawAndWhere(query: string): PostgresQueryBuilder<T>;
    rawOrWhere(query: string): PostgresQueryBuilder<T>;
    rawWhere(query: string): PostgresQueryBuilder<T>;
    whereBetween(column: string, min: string, max: string): PostgresQueryBuilder<T>;
    whereIn(column: string, values: string[]): PostgresQueryBuilder<T>;
    whereNotBetween(column: string, min: string, max: string): PostgresQueryBuilder<T>;
    whereNotIn(column: string, values: string[]): PostgresQueryBuilder<T>;
    whereNotNull(column: string): PostgresQueryBuilder<T>;
    whereNull(column: string): PostgresQueryBuilder<T>;
}

declare abstract class QueryBuilder<T extends Model> {
    protected selectQuery: string;
    protected relations: string[];
    protected whereQuery: string;
    protected groupByQuery: string;
    protected orderByQuery: string;
    protected limitQuery: string;
    protected offsetQuery: string;
    protected model: new () => Model;
    protected tableName: string;
    protected logs: boolean;
    protected selectTemplate: SelectTemplateType;
    protected whereTemplate: WhereTemplateType;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param logs - A boolean indicating whether to log queries.
     */
    protected constructor(model: new () => Model, tableName: string, logs: boolean);
    /**
     * @description Executes the query and retrieves the first result.
     * @returns A Promise resolving to the first result or null.
     */
    abstract one(): Promise<T | null>;
    /**
     * @description Executes the query and retrieves multiple results.
     * @returns A Promise resolving to an array of results.
     */
    abstract many(): Promise<T[]>;
    /**
     * @description Executes the query and retrieves multiple results.
     * @returns A Promise resolving to an array of results.
     */
    abstract paginate(page: number, limit: number): Promise<{
        paginationMetadata: PaginationMetadata;
        data: T[];
    }>;
    /**
     * @description Columns are customizable with aliases. By default, without this function, all columns are selected
     * @param columns
     */
    abstract select(...columns: string[]): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a relation to the query.
     * @param relations - The relations to add.
     */
    abstract addRelations(relations: string[]): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract where(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhere(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhere(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereBetween(column: string, min: string, max: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhereBetween(column: string, min: string, max: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereBetween(column: string, min: string, max: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereNotBetween(column: string, min: string, max: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereNotBetween(column: string, min: string, max: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereIn(column: string, values: string[]): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhereIn(column: string, values: string[]): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereIn(column: string, values: string[]): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereNotIn(column: string, values: string[]): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereNotIn(column: string, values: string[]): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereNull(column: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhereNull(column: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereNull(column: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereNotNull(column: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhereNotNull(column: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereNotNull(column: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a raw WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract rawWhere(query: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a raw AND WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract rawAndWhere(query: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a raw OR WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract rawOrWhere(query: string): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds GROUP BY conditions to the query.
     * @param columns - The columns to group by.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract groupBy(...columns: string[]): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds ORDER BY conditions to the query.
     * @param column - The column to order by.
     * @param order - The order direction, either "ASC" or "DESC".
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orderBy(column: string[], order: "ASC" | "DESC"): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds a LIMIT condition to the query.
     * @param limit - The maximum number of rows to return.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract limit(limit: number): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Adds an OFFSET condition to the query.
     * @param offset - The number of rows to skip.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract offset(offset: number): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    protected groupFooterQuery(): string;
}

declare class MysqlQueryBuilder<T extends Model> extends QueryBuilder<T> {
    protected mysqlPool: Pool$1;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param mysqlPool - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     */
    constructor(model: new () => T, tableName: string, mysqlPool: Pool$1, logs: boolean);
    private mergeRetrievedDataIntoModel;
    /**
     * @description Executes the query and retrieves the first result.
     * @returns A Promise resolving to the first result or null.
     */
    one(): Promise<T | null>;
    /**
     * @description Executes the query and retrieves multiple results.
     * @returns A Promise resolving to an array of results.
     */
    many(): Promise<T[]>;
    /**
     * @description Paginates the query results with the given page and limit.
     * @param page
     * @param limit
     */
    paginate(page: number, limit: number): Promise<{
        paginationMetadata: PaginationMetadata;
        data: T[];
    }>;
    /**
     * @description Columns are customizable with aliases. By default, without this function, all columns are selected
     * @param columns
     */
    select(...columns: string[]): this;
    addRelations(relations: string[]): this;
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    where(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): this;
    /**
     * @description Adds an AND WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhere(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): this;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhere(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): this;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhereBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereNotBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereNotBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereIn(column: string, values: string[]): this;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhereIn(column: string, values: string[]): this;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereIn(column: string, values: string[]): this;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereNotIn(column: string, values: string[]): this;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereNotIn(column: string, values: string[]): this;
    /**
     * @description Adds a WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereNull(column: string): this;
    /**
     * @description Adds an AND WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhereNull(column: string): this;
    /**
     * @description Adds an OR WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereNull(column: string): this;
    /**
     * @description Adds a WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereNotNull(column: string): this;
    /**
     * @description Adds an AND WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhereNotNull(column: string): this;
    /**
     * @description Adds an OR WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereNotNull(column: string): this;
    /**
     * @description Adds a raw WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    rawWhere(query: string): this;
    /**
     * @description Adds a raw AND WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    rawAndWhere(query: string): this;
    /**
     * @description Adds a raw OR WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    rawOrWhere(query: string): this;
    /**
     * @description Adds GROUP BY conditions to the query.
     * @param columns - The columns to group by.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    groupBy(...columns: string[]): this;
    /**
     * @description Adds ORDER BY conditions to the query.
     * @param column - The column to order by.
     * @param order - The order direction, either "ASC" or "DESC".
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orderBy(column: string[], order: "ASC" | "DESC"): this;
    /**
     * @description Adds a LIMIT condition to the query.
     * @param limit - The maximum number of rows to return.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    limit(limit: number): this;
    /**
     * @description Adds an OFFSET condition to the query.
     * @param offset - The number of rows to skip.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    offset(offset: number): this;
    protected groupFooterQuery(): string;
}

declare class MysqlTransaction {
    protected tableName: string;
    protected mysql: Pool$1;
    protected mysqlConnection: PoolConnection;
    protected logs: boolean;
    constructor(mysql: Pool$1, tableName: string, logs: boolean);
    queryInsert<T extends Model>(query: string, metadata: Metadata, params?: any[]): Promise<T>;
    queryUpdate<T extends Model>(query: string, params?: any[]): Promise<number>;
    queryDelete(query: string, params?: any[]): Promise<number>;
    /**
     * Start transaction.
     */
    start(): Promise<void>;
    /**
     * Commit transaction.
     */
    commit(): Promise<void>;
    /**
     * Rollback transaction.
     */
    rollback(): Promise<void>;
}

declare class PostgresTransaction {
    protected tableName: string;
    protected pgPool: Pool;
    protected pgClient: PoolClient;
    protected logs: boolean;
    constructor(pgPool: Pool, tableName: string, logs: boolean);
    queryInsert<T extends Model>(query: string, metadata: Metadata, params?: any[]): Promise<T>;
    queryUpdate<T extends Model>(query: string, params?: any[]): Promise<number | null>;
    queryDelete(query: string, params?: any[]): Promise<number | null>;
    /**
     * Start transaction.
     */
    start(): Promise<void>;
    /**
     * Commit transaction.
     */
    commit(): Promise<void>;
    /**
     * Rollback transaction.
     */
    rollback(): Promise<void>;
}

declare abstract class AbstractModelManager<T extends Model> {
    protected logs: boolean;
    protected model: new () => T;
    protected modelInstance: T;
    tableName: string;
    protected constructor(model: new () => T, logs: boolean);
    abstract find(input?: FindType): Promise<T[]>;
    abstract findOne(input: FindOneType): Promise<T | null>;
    abstract findOneById(id: string | number): Promise<T | null>;
    abstract save(model: T, trx?: MysqlTransaction | PostgresTransaction): Promise<T | null>;
    abstract update(model: T, trx?: MysqlTransaction | PostgresTransaction): Promise<T | null>;
    abstract deleteByColumn(column: string, value: string | number | boolean, trx?: MysqlTransaction | PostgresTransaction): Promise<number> | Promise<number | null>;
    abstract delete(model: T, trx?: MysqlTransaction | PostgresTransaction): Promise<T | null>;
    abstract createTransaction(): MysqlTransaction | PostgresTransaction;
    abstract queryBuilder(): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
}

type DatasourceType = "mysql" | "postgres";
interface DatasourceInput {
    readonly type: DatasourceType;
    readonly host: string;
    readonly port: number;
    readonly username: string;
    readonly password: string;
    readonly database: string;
    readonly logs?: boolean;
}
declare abstract class Datasource {
    protected type: DatasourceType;
    protected host: string;
    protected port: number;
    protected username: string;
    protected password: string;
    protected database: string;
    protected logs: boolean;
    protected constructor(input: DatasourceInput);
    abstract connect(): Promise<void>;
    abstract getModelManager(model: typeof Model): AbstractModelManager<Model>;
}

declare class MysqlModelManager<T extends Model> extends AbstractModelManager<T> {
    protected mysqlPool: mysql.Pool;
    /**
     * Constructor for MysqlModelManager class.
     *
     * @param {new () => T} model - Model constructor.
     * @param {Pool} mysqlConnection - MySQL connection pool.
     * @param {boolean} logs - Flag to enable or disable logging.
     */
    constructor(model: new () => T, mysqlConnection: mysql.Pool, logs: boolean);
    /**
     * Find method to retrieve multiple records from the database based on the input conditions.
     *
     * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
     * @returns Promise resolving to an array of models.
     */
    find(input?: FindType): Promise<T[]>;
    /**
     * Find a single record from the database based on the input conditions.
     *
     * @param {FindOneType} input - Query parameters for filtering and selecting a single record.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOne(input: FindOneType): Promise<T | null>;
    /**
     * Find a single record by its ID from the database.
     *
     * @param {string | number} id - ID of the record to retrieve.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOneById(id: string | number): Promise<T | null>;
    /**
     * Save a new model instance to the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
     * @returns Promise resolving to the saved model or null if saving fails.
     */
    save(model: T, trx?: MysqlTransaction): Promise<T | null>;
    /**
     * Update an existing model instance in the database.
     * @param {Model} model - Model instance to be updated.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the update operation.
     * @returns Promise resolving to the updated model or null if updating fails.
     */
    update(model: T, trx?: MysqlTransaction): Promise<T | null>;
    /**
     * @description Delete a record from the database from the given column and value.
     *
     * @param {string} column - Column to filter by.
     * @param {string | number | boolean} value - Value to filter by.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
     * @returns Promise resolving to affected rows count
     */
    deleteByColumn(column: string, value: string | number | boolean, trx?: MysqlTransaction): Promise<number>;
    /**
     * @description Delete a record from the database from the given model.
     *
     * @param {Model} model - Model to delete.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    delete(model: T, trx?: MysqlTransaction): Promise<T | null>;
    /**
     * @description Creates a new transaction.
     * @returns {MysqlTransaction} - Instance of MysqlTransaction.
     */
    createTransaction(): MysqlTransaction;
    /**
     * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
     *
     * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
     */
    queryBuilder(): MysqlQueryBuilder<T>;
}

declare class PostgresModelManager<T extends Model> extends AbstractModelManager<T> {
    protected pgPool: pg.Pool;
    /**
     * Constructor for PostgresModelManager class.
     *
     * @param {new () => T} model - Model constructor.
     * @param {Pool} pgConnection - PostgreSQL connection pool.
     * @param {boolean} logs - Flag to enable or disable logging.
     */
    constructor(model: new () => T, pgConnection: pg.Pool, logs: boolean);
    /**
     * Find method to retrieve multiple records from the database based on the input conditions.
     *
     * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
     * @returns Promise resolving to an array of models.
     */
    find(input?: FindType): Promise<T[]>;
    /**
     * Find a single record from the database based on the input conditions.
     *
     * @param {FindOneType} input - Query parameters for filtering and selecting a single record.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOne(input: FindOneType): Promise<T | null>;
    /**
     * Find a single record by its ID from the database.
     *
     * @param {string | number} id - ID of the record to retrieve.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOneById(id: string | number): Promise<T | null>;
    /**
     * Save a new model instance to the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
     * @returns Promise resolving to the saved model or null if saving fails.
     */
    save(model: T, trx?: PostgresTransaction): Promise<T | null>;
    /**
     * Update an existing model instance in the database.
     * @param {Model} model - Model instance to be updated.
     * @param {PostgresTransaction} trx - PostgresTransaction to be used on the update operation.
     * @returns Promise resolving to the updated model or null if updating fails.
     */
    update(model: T, trx?: PostgresTransaction): Promise<T | null>;
    /**
     * @description Delete a record from the database from the given column and value.
     *
     * @param {string} column - Column to filter by.
     * @param {string | number | boolean} value - Value to filter by.
     * @param {PostgresTransaction} trx - PostgresTransaction to be used on the delete operation.
     * @returns Promise resolving to affected rows count
     */
    deleteByColumn(column: string, value: string | number | boolean, trx?: PostgresTransaction): Promise<number>;
    /**
     * @description Delete a record from the database from the given model.
     *
     * @param {Model} model - Model to delete.
     * @param {PostgresTransaction} trx - PostgresTransaction to be used on the delete operation.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    delete(model: T, trx?: PostgresTransaction): Promise<T | null>;
    /**
     * @description Creates a new transaction.
     * @returns {MysqlTransaction} - Instance of MysqlTransaction.
     */
    createTransaction(): PostgresTransaction;
    /**
     * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
     *
     * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
     */
    queryBuilder(): PostgresQueryBuilder<T>;
}

type ModelManager<T extends Model> = MysqlModelManager<T> | PostgresModelManager<T>;
type SqlPoolType = mysql.Pool | pg.Pool;
type SqlPoolConnectionType = mysql.PoolConnection | pg.PoolClient;
declare class SqlDatasource extends Datasource {
    protected sqlPool: SqlPoolType;
    constructor(input: DatasourceInput);
    /**
     * @description Connects to the database establishing a connection pool.
     */
    connect(): Promise<void>;
    /**
     * @description Returns model manager for the provided model
     * @param model
     */
    getModelManager<T extends Model>(model: new () => T): ModelManager<T>;
    /**
     * @description Returns raw mysql pool
     */
    getRawPool(): Promise<SqlPoolType>;
    /**
     * @description Returns raw mysql PoolConnection
     */
    getRawPoolConnection(): Promise<SqlPoolConnectionType>;
}

type NumericType = "INT" | "BIGINT" | "FLOAT" | "DOUBLE" | "DECIMAL" | "TINYINT" | "SMALLINT" | "MEDIUMINT";
type StringType = "UUID" | "VARCHAR" | "TEXT" | "CHAR" | "TINYTEXT" | "MEDIUMTEXT" | "LONGTEXT";
type DateTimeType = "DATE" | "DATETIME" | "TIMESTAMP" | "TIME";
type BooleanType = "BOOLEAN" | "BIT";
type EnumType = "ENUM";
type SetType = "SET";
type ColumnType = NumericType | StringType | DateTimeType | BooleanType | EnumType | SetType;
interface ColumnConfig {
    autoIncrement?: boolean;
    unsigned?: boolean;
    nullable?: boolean;
    unique?: boolean;
    primary?: boolean;
    references?: {
        table: string;
        column: string;
    };
    defaultValue?: string | number | boolean;
    autoCreate?: boolean;
    autoUpdate?: boolean;
    cascade?: boolean;
}

declare class Column {
    name: string;
    oldName?: string;
    type: ColumnType;
    values?: string[];
    length?: number;
    alter?: boolean;
    after?: string;
    config: ColumnConfig;
    getColumn(): Column;
}

declare class DropColumn {
    name: string;
    foreignKey: boolean;
    constructor(name: string, foreignKey?: boolean);
    getColumn(): DropColumn;
}

declare class ColumnConfigBuilder {
    protected column: Column;
    protected table: Table;
    protected migrationType: MigrationType;
    constructor(column: Column, table: Table, migrationType: MigrationType);
    nullable(): ColumnConfigBuilder;
    notNullable(): ColumnConfigBuilder;
    unique(): ColumnConfigBuilder;
    autoIncrement(): ColumnConfigBuilder;
    primary(): ColumnConfigBuilder;
    cascade(): ColumnConfigBuilder;
    defaultValue(value: string): ColumnConfigBuilder;
    autoCreate(): ColumnConfigBuilder;
    autoUpdate(): ColumnConfigBuilder;
    references(table: string, column: string): ColumnConfigBuilder;
    unsigned(): ColumnConfigBuilder;
    commit(): void;
    alter(): ColumnConfigBuilder;
    after(columnName: string): ColumnConfigBuilder;
}

declare class ColumnTypeBuilder {
    protected column: Column;
    protected table: Table;
    protected migrationType: MigrationType;
    constructor(column: Column, table: Table, migrationType: MigrationType);
    string(name: string, length?: number): ColumnConfigBuilder;
    text(name: string): ColumnConfigBuilder;
    int(name: string, length?: number): ColumnConfigBuilder;
    bigInt(name: string): ColumnConfigBuilder;
    float(name: string): ColumnConfigBuilder;
    double(name: string): ColumnConfigBuilder;
    decimal(name: string): ColumnConfigBuilder;
    boolean(name: string): ColumnConfigBuilder;
    date(name: string): ColumnConfigBuilder;
    dateTime(name: string): ColumnConfigBuilder;
    time(name: string): ColumnConfigBuilder;
    timestamp(name: string): ColumnConfigBuilder;
    bit(name: string): ColumnConfigBuilder;
    enum(name: string, values: string[]): ColumnConfigBuilder;
    set(name: string, values: string[]): ColumnConfigBuilder;
    uuid(name: string): ColumnConfigBuilder;
    char(name: string): ColumnConfigBuilder;
    tinyText(name: string): ColumnConfigBuilder;
    mediumText(name: string): ColumnConfigBuilder;
    longText(name: string): ColumnConfigBuilder;
    tinyInteger(name: string): ColumnConfigBuilder;
    smallInteger(name: string): ColumnConfigBuilder;
    mediumInteger(name: string): ColumnConfigBuilder;
    renameColumn(oldName: string, newName: string): ColumnConfigBuilder;
    commit(): void;
    alter(): ColumnConfigBuilder;
    after(columnName: string): ColumnTypeBuilder;
}

declare class Table {
    tableName: string;
    columnsToAdd: Column[];
    columnsToAlter: Column[];
    columnsToDelete: DropColumn[];
    dropTable: boolean;
    truncateTable: boolean;
    migrationType: MigrationType;
    constructor(tableName: string, migrationType: MigrationType);
    column(): ColumnTypeBuilder;
    dropColumn(columnName: string, foreignKey?: boolean): void;
    drop(): void;
    truncate(): void;
}

type MigrationType = "create" | "alter" | "rawQuery" | "drop" | "drop-force";
declare abstract class Migration {
    migrationName: string;
    tableName: string;
    migrationType: MigrationType;
    table: Table;
    rawQuery: string;
    abstract up(): void;
    abstract down(): void;
    /**
     * @description Use this method to manage a table in your database (create, alter, drop)
     * @param tableName
     * @param migrationType
     */
    useTable(tableName: string, migrationType: MigrationType): void;
    /**
     * @description Use this method to run a raw query in your database
     * @param query
     */
    useRawQuery(query: string): void;
}

export { BelongsTo, type DatasourceInput, HasMany, HasOne, Migration, Model, SqlDatasource };
