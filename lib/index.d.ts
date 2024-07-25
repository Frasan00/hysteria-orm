import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import pg, { Pool as Pool$1, PoolClient } from 'pg';

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

type WhereOperatorType = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "ILIKE";
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
type PaginatedData<T> = {
    paginationMetadata: PaginationMetadata;
    data: T[];
};

declare class MysqlQueryBuilder<T extends Model> extends QueryBuilder<T> {
    protected mysqlPool: Pool;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param mysqlPool - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: new () => T, tableName: string, mysqlPool: Pool, logs: boolean, isNestedCondition?: boolean);
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
     * @description Paginates the query results with the given page and limit, it removes any previous limit - offset calls
     * @param page
     * @param limit
     */
    paginate(page: number, limit: number): Promise<PaginatedData<T>>;
    /**
     * @description Columns are customizable with aliases. By default, without this function, all columns are selected
     * @param columns
     */
    select(...columns: string[]): this;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): MysqlQueryBuilder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): MysqlQueryBuilder<T>;
    addRelations(relations: string[]): this;
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    where(column: string, value: BaseValues, operator?: WhereOperatorType): this;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    whereBuilder(cb: (queryBuilder: MysqlQueryBuilder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: MysqlQueryBuilder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: MysqlQueryBuilder<T>) => void): this;
    /**
     * @description Adds an AND WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhere(column: string, value: BaseValues, operator?: WhereOperatorType): this;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhere(column: string, value: BaseValues, operator?: WhereOperatorType): this;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereNotIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereNotIn(column: string, values: BaseValues[]): this;
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

type QueryBuilders<T extends Model> = MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
declare abstract class QueryBuilder<T extends Model> {
    protected selectQuery: string;
    protected joinQuery: string;
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
    abstract paginate(page: number, limit: number): Promise<PaginatedData<T>>;
    /**
     * @description Columns are customizable with aliases. By default, without this function, all columns are selected
     * @param columns
     */
    abstract select(...columns: string[]): QueryBuilders<T>;
    /**
     *
     * @param table
     * @param primaryColumn
     * @param foreignColumn
     */
    abstract join(table: string, primaryColumn: string, foreignColumn: string): QueryBuilders<T>;
    /**
     *
     * @param table
     * @param primaryColumn
     * @param foreignColumn
     */
    abstract leftJoin(table: string, primaryColumn: string, foreignColumn: string): QueryBuilders<T>;
    /**
     * @description Adds a relation to the query.
     * @param relations - The relations to add.
     */
    abstract addRelations(relations: string[]): QueryBuilders<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    abstract whereBuilder(cb: (queryBuilder: QueryBuilders<T>) => void): QueryBuilders<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    abstract andWhereBuilder(cb: (queryBuilder: QueryBuilders<T>) => void): QueryBuilders<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    abstract orWhereBuilder(cb: (queryBuilder: QueryBuilders<T>) => void): QueryBuilders<T>;
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract where(column: string, value: BaseValues, operator: WhereOperatorType): QueryBuilders<T>;
    /**
     * @description Adds an AND WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhere(column: string, value: BaseValues, operator: WhereOperatorType): QueryBuilders<T>;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhere(column: string, value: BaseValues, operator: WhereOperatorType): QueryBuilders<T>;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereBetween(column: string, min: BaseValues, max: BaseValues): QueryBuilders<T>;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhereBetween(column: string, min: BaseValues, max: BaseValues): QueryBuilders<T>;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereBetween(column: string, min: BaseValues, max: BaseValues): QueryBuilders<T>;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereNotBetween(column: string, min: BaseValues, max: BaseValues): QueryBuilders<T>;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): QueryBuilders<T>;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereIn(column: string, values: BaseValues[]): QueryBuilders<T>;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhereIn(column: string, values: BaseValues[]): QueryBuilders<T>;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereIn(column: string, values: BaseValues[]): QueryBuilders<T>;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereNotIn(column: string, values: BaseValues[]): QueryBuilders<T>;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereNotIn(column: string, values: BaseValues[]): QueryBuilders<T>;
    /**
     * @description Adds a WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereNull(column: string): QueryBuilders<T>;
    /**
     * @description Adds an AND WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhereNull(column: string): QueryBuilders<T>;
    /**
     * @description Adds an OR WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereNull(column: string): QueryBuilders<T>;
    /**
     * @description Adds a WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract whereNotNull(column: string): QueryBuilders<T>;
    /**
     * @description Adds an AND WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract andWhereNotNull(column: string): QueryBuilders<T>;
    /**
     * @description Adds an OR WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orWhereNotNull(column: string): QueryBuilders<T>;
    /**
     * @description Adds a raw WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract rawWhere(query: string): QueryBuilders<T>;
    /**
     * @description Adds a raw AND WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract rawAndWhere(query: string): QueryBuilders<T>;
    /**
     * @description Adds a raw OR WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract rawOrWhere(query: string): QueryBuilders<T>;
    /**
     * @description Adds GROUP BY conditions to the query.
     * @param columns - The columns to group by.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract groupBy(...columns: BaseValues[]): QueryBuilders<T>;
    /**
     * @description Adds ORDER BY conditions to the query.
     * @param column - The column to order by.
     * @param order - The order direction, either "ASC" or "DESC".
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orderBy(column: BaseValues[], order: "ASC" | "DESC"): QueryBuilders<T>;
    /**
     * @description Adds a LIMIT condition to the query.
     * @param limit - The maximum number of rows to return.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract limit(limit: number): QueryBuilders<T>;
    /**
     * @description Adds an OFFSET condition to the query.
     * @param offset - The number of rows to skip.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract offset(offset: number): QueryBuilders<T>;
    protected groupFooterQuery(): string;
}

declare class PostgresQueryBuilder<T extends Model> extends QueryBuilder<T> {
    select(...columns: string[]): PostgresQueryBuilder<T> | MysqlQueryBuilder<T>;
    protected pgPool: Pool$1;
    protected isNestedCondition: boolean;
    constructor(model: new () => T, tableName: string, pgPool: Pool$1, logs: boolean, isNestedCondition?: boolean);
    private mergeRetrievedDataIntoModel;
    one(): Promise<T | null>;
    many(): Promise<T[]>;
    /**
     * @description Paginates the query results with the given page and limit, it removes any previous limit - offset call
     * @param page
     * @param limit
     */
    paginate(page: number, limit: number): Promise<PaginatedData<T>>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): PostgresQueryBuilder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): PostgresQueryBuilder<T>;
    addRelations(relations: string[]): PostgresQueryBuilder<T>;
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    where(column: string, value: BaseValues, operator?: WhereOperatorType): this;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    whereBuilder(cb: (queryBuilder: PostgresQueryBuilder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: PostgresQueryBuilder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: PostgresQueryBuilder<T>) => void): this;
    /**
     * @description Adds an AND WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhere(column: string, value: BaseValues, operator?: WhereOperatorType): this;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhere(column: string, value: BaseValues, operator?: WhereOperatorType): this;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    andWhereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    whereNotIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    orWhereNotIn(column: string, values: BaseValues[]): this;
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
}

declare class MysqlTransaction {
    protected tableName: string;
    protected mysql: Pool;
    protected mysqlConnection: PoolConnection;
    protected logs: boolean;
    constructor(mysql: Pool, tableName: string, logs: boolean);
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
    protected pgPool: Pool$1;
    protected pgClient: PoolClient;
    protected logs: boolean;
    constructor(pgPool: Pool$1, tableName: string, logs: boolean);
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

interface Metadata {
    readonly tableName: string;
    readonly primaryKey?: string;
}
declare abstract class Model {
    aliasColumns: {
        [key: string]: string | number | boolean;
    };
    metadata: Metadata;
    private static sqlInstance;
    protected constructor(options: {
        tableName?: string;
        primaryKey?: string;
    });
    /**
     * @description Connects to the database with the given connection details, then after the callback is executed, it disconnects from the database and connects back to the original database specified in the SqlDataSource class
     * @param connectionDetails - connection details for the database for the temp connection
     * @param cb - function containing all the database operations on the provided connection details
     * @returns
     */
    static useConnection<T extends Model>(this: new () => T, connectionDetails: DatasourceInput, cb: () => Promise<void>): Promise<void>;
    /**
     * @description Gives a query instance for the given model
     * @param model
     * @returns
     */
    static query<T extends Model>(this: new () => T): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    /**
     * @description Finds records for the given model
     * @param model
     * @param {FindType} options
     * @returns
     */
    static find<T extends Model>(this: new () => T, options?: FindType): Promise<T[]>;
    /**
     * @description Finds a record for the given model
     * @param model
     * @param {FindOneType} options
     * @returns
     */
    static findOne<T extends Model>(this: new () => T, options: FindOneType): Promise<T | null>;
    /**
     * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
     * @param model
     * @param {number | string} id
     * @returns
     */
    static findOneById<T extends Model>(this: new () => T, id: string | number): Promise<T | null>;
    /**
     * @description Saves a new record to the database
     * @param model
     * @param {Model} modelInstance
     * @param {MysqlTransaction & PostgresTransaction} trx
     * @returns
     */
    static save<T extends Model>(this: new () => T, modelInstance: T, trx?: MysqlTransaction & PostgresTransaction): Promise<T | null>;
    /**
     * @description Updates a record to the database
     * @param model
     * @param {Model} modelInstance
     * @param {MysqlTransaction & PostgresTransaction} trx
     * @returns
     */
    static update<T extends Model>(this: new () => T, modelInstance: T, trx?: MysqlTransaction & PostgresTransaction): Promise<T | null>;
    /**
     * @description Deletes a record to the database
     * @param model
     * @param {Model} modelInstance
     * @param {MysqlTransaction & PostgresTransaction} trx
     * @returns
     */
    static delete<T extends Model>(this: new () => T, modelInstance: T, trx?: MysqlTransaction & PostgresTransaction): Promise<T | null>;
    /**
     * @description Deletes a record to the database
     * @param model
     * @param {Model} modelInstance
     * @param {string} column
     * @param {string | number | boolean} value
     * @param {MysqlTransaction & PostgresTransaction} trx
     * @returns
     */
    static deleteByColumn<T extends Model>(this: new () => T, column: string, value: string | number | boolean, trx?: MysqlTransaction & PostgresTransaction): Promise<number>;
    /**
     * @description Deletes a record to the database
     * @param model
     * @param {Model} modelInstance
     * @returns
     */
    static getMetadata<T extends Model>(this: new () => T): Metadata;
    static setProps<T extends Model>(instance: T, data: Partial<T>): void;
    private static establishConnection;
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

declare class ColumnOptionsBuilder {
    protected tableName: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected columnName: string;
    protected columnReferences?: {
        table: string;
        column: string;
    };
    protected sqlType: "mysql" | "postgres";
    constructor(tableName: string, queryStatements: string[], partialQuery: string, sqlType: "mysql" | "postgres", columnName?: string, columnReferences?: {
        table: string;
        column: string;
    });
    /**
     * @description Makes the column nullable
     */
    nullable(): ColumnOptionsBuilder;
    /**
     * @description Makes the column unsigned allowing only positive values
     */
    unsigned(): ColumnOptionsBuilder;
    /**
     * @description Makes the column not nullable
     */
    notNullable(): ColumnOptionsBuilder;
    /**
     * @description Makes the column the primary key
     */
    primary(): ColumnOptionsBuilder;
    /**
     * @description Adds an unique constraint
     */
    unique(): ColumnOptionsBuilder;
    /**
     * @description Adds an auto increment - only for mysql
     */
    autoIncrement(): ColumnOptionsBuilder;
    /**
     * @description Adds a foreign key with a specific constraint
     * @param table
     * @param column
     */
    references(table: string, column: string): ColumnOptionsBuilder;
    /**
     * @description Chains a new column creation
     */
    newColumn(): ColumnTypeBuilder;
    /**
     * @description Commits the column creation - if omitted, the migration will be run empty
     */
    commit(): void;
}

declare class ColumnTypeBuilder {
    protected tableName: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected columnName: string;
    protected sqlType: `mysql` | `postgres`;
    constructor(tableName: string, queryStatements: string[], partialQuery: string, sqlType: `mysql` | `postgres`);
    varchar(name: string, length: number): ColumnOptionsBuilder;
    tinytext(name: string): ColumnOptionsBuilder;
    mediumtext(name: string): ColumnOptionsBuilder;
    longtext(name: string): ColumnOptionsBuilder;
    binary(name: string, length: number): ColumnOptionsBuilder;
    enum(name: string, values: string[]): ColumnOptionsBuilder;
    text(name: string): ColumnOptionsBuilder;
    char(name: string, length: number): ColumnOptionsBuilder;
    tinyint(name: string): ColumnOptionsBuilder;
    smallint(name: string): ColumnOptionsBuilder;
    mediumint(name: string): ColumnOptionsBuilder;
    /**
     * @description If using mysql, it will automatically add INT AUTO_INCREMENT PRIMARY KEY
     * @param name
     */
    serial(name: string): ColumnOptionsBuilder;
    /**
     * @description If using mysql, it will automatically add BIGINT AUTO_INCREMENT PRIMARY KEY
     * @param name
     */
    bigSerial(name: string): ColumnOptionsBuilder;
    integer(name: string): ColumnOptionsBuilder;
    bigint(name: string): ColumnOptionsBuilder;
    float(name: string): ColumnOptionsBuilder;
    decimal(name: string): ColumnOptionsBuilder;
    double(name: string): ColumnOptionsBuilder;
    boolean(name: string): ColumnOptionsBuilder;
    date(name: string): ColumnOptionsBuilder;
    timestamp(name: string): ColumnOptionsBuilder;
    /**
     * @description EXPERIMENTAL
     * @param name
     */
    json(name: string): ColumnOptionsBuilder;
    /**
     * @description EXPERIMENTAL
     * @param name
     */
    jsonb(name: string): ColumnOptionsBuilder;
}

declare class ColumnBuilderConnector {
    protected tableName: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected sqlType: "mysql" | "postgres";
    constructor(tableName: string, queryStatements: string[], partialQuery: string, sqlType: "mysql" | "postgres");
    newColumn(): ColumnTypeBuilder;
}

type AlterOptions = {
    afterColumn?: string;
    references?: {
        table: string;
        column: string;
    };
};
type DataType = "varchar" | "tinytext" | "mediumtext" | "longtext" | "binary" | "text" | "char" | "tinyint" | "smallint" | "mediumint" | "integer" | "bigint" | "float" | "decimal" | "double" | "boolean" | "date" | "timestamp" | "json" | "jsonb";
declare class ColumnBuilderAlter {
    protected tableName: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected sqlType: "mysql" | "postgres";
    constructor(tableName: string, queryStatements: string[], partialQuery: string, sqlType: "mysql" | "postgres");
    /**
     * @description Add a new column to the table
     * @param columnName { string }
     * @param dataType { varchar | tinytext | mediumtext | longtext | binary | text | char | tinyint | smallint | mediumint | integer | bigint | float | decimal | double | boolean | date | timestamp | json | jsonb }
     * @param options { afterColumn?: string; references?: { table: string; column: string }; default?: string; primaryKey?: boolean; unique?: boolean; notNullable?: boolean; autoIncrement?: boolean; length?: number; }
     */
    addColumn(columnName: string, dataType: DataType, options?: {
        afterColumn?: string;
        references?: {
            table: string;
            column: string;
        };
        default?: string;
        primaryKey?: boolean;
        unique?: boolean;
        notNullable?: boolean;
        autoIncrement?: boolean;
        length?: number;
    }): ColumnBuilderAlter;
    /**
     * @description Add a new enum column to the table
     * @param columnName { string }
     * @param values { string[] }
     * @param options { afterColumn?: string; notNullable?: boolean }
     */
    addEnumColumn(columnName: string, values: string[], options?: {
        afterColumn?: string;
        notNullable?: boolean;
    }): ColumnBuilderAlter;
    /**
     * @description Drops a column from the table
     * @param columnName
     */
    dropColumn(columnName: string): ColumnBuilderAlter;
    /**
     * @description Renames a column
     * @param oldColumnName
     * @param newColumnName
     */
    renameColumn(oldColumnName: string, newColumnName: string): ColumnBuilderAlter;
    modifyColumnType(columnName: string, newDataType: DataType, length?: number): ColumnBuilderAlter;
    /**
     * @description Renames a table
     * @param oldTableName
     * @param newTableName
     */
    renameTable(oldTableName: string, newTableName: string): ColumnBuilderAlter;
    /**
     * @description Set a default value
     * @param columnName
     * @param defaultValue
     */
    setDefaultValue(columnName: string, defaultValue: string): ColumnBuilderAlter;
    /**
     * @description Drop a default value
     * @param columnName
     */
    dropDefaultValue(columnName: string): ColumnBuilderAlter;
    /**
     * @description Add a foreign key
     * @param columnName
     * @param options
     */
    addForeignKey(columnName: string, options: AlterOptions): ColumnBuilderAlter;
    /**
     * @description Drop a foreign key
     * @param columnName
     */
    dropForeignKey(columnName: string): ColumnBuilderAlter;
    /**
     * @description Add a primary key
     * @param columnNames
     */
    addPrimaryKey(columnNames: string[]): ColumnBuilderAlter;
    /**
     * @description Drop a primary key
     */
    dropPrimaryKey(): ColumnBuilderAlter;
    /**
     * @description Add a check constraint - EXPERIMENTAL
     * @param condition
     * @param constraintName
     */
    addCheckConstraint(condition: string, constraintName?: string): ColumnBuilderAlter;
    /**
     * @description drop a check constraint - EXPERIMENTAL
     * @param constraintName
     */
    dropCheckConstraint(constraintName: string): ColumnBuilderAlter;
    /**
     * @description Add a unique constraint - EXPERIMENTAL
     * @param columnNames
     * @param constraintName
     */
    addUniqueConstraint(columnNames: string[], constraintName?: string): ColumnBuilderAlter;
    /**
     * @description Drop a unique constraint - EXPERIMENTAL
     * @param constraintName
     */
    dropUniqueConstraint(constraintName: string): ColumnBuilderAlter;
    /**
     * @description Commits the changes - if omitted, the migration will be run empty
     */
    commit(): void;
}

declare class Schema {
    queryStatements: string[];
    sqlType: "mysql" | "postgres";
    constructor(sqlType?: "mysql" | "postgres");
    rawQuery(query: string): void;
    createTable(tableName: string, options: {
        ifNotExists?: boolean;
    }): ColumnBuilderConnector;
    alterTable(tableName: string): ColumnBuilderAlter;
    dropTable(tableName: string, ifExists?: boolean): void;
    truncateTable(tableName: string): void;
}

declare abstract class Migration {
    migrationName: string;
    schema: Schema;
    abstract up(): void;
    abstract down(): void;
}

declare abstract class AbstractModelManager<T extends Model> {
    protected logs: boolean;
    protected model: new () => T;
    protected modelInstance: T;
    tableName: string;
    protected constructor(model: new () => T, logs: boolean);
    abstract getMetadata(): Metadata;
    abstract find(input?: FindType): Promise<T[]>;
    abstract findOne(input: FindOneType): Promise<T | null>;
    abstract findOneById(id: string | number): Promise<T | null>;
    abstract save(model: T, trx?: MysqlTransaction | PostgresTransaction): Promise<T | null>;
    abstract update(model: T, trx?: MysqlTransaction | PostgresTransaction): Promise<T | null>;
    abstract deleteByColumn(column: string, value: string | number | boolean, trx?: MysqlTransaction | PostgresTransaction): Promise<number> | Promise<number | null>;
    abstract delete(model: T, trx?: MysqlTransaction | PostgresTransaction): Promise<T | null>;
    abstract query(): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
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
    getMetadata(): Metadata;
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
     * @returns {Promise<MysqlTransaction>} - Instance of MysqlTransaction.
     */
    startTransaction(): Promise<MysqlTransaction>;
    /**
     * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
     *
     * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
     */
    query(): MysqlQueryBuilder<T>;
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
     * Returns table name and primary key fot he model manager
     * @returns {Metadata}
     */
    getMetadata(): Metadata;
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
    startTransaction(): Promise<PostgresTransaction>;
    /**
     * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
     *
     * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
     */
    query(): PostgresQueryBuilder<T>;
}

type ModelManager<T extends Model> = MysqlModelManager<T> | PostgresModelManager<T>;
type SqlPoolType = mysql.Pool | pg.Pool;
type SqlPoolConnectionType = mysql.PoolConnection | pg.PoolClient;
declare class SqlDataSource extends Datasource {
    isConnected: boolean;
    protected sqlPool: SqlPoolType;
    private static instance;
    private constructor();
    /**
     * @description Connects to the database establishing a connection pool.
     */
    static connect(input: DatasourceInput): Promise<SqlDataSource>;
    static getInstance(): SqlDataSource;
    /**
     * @description Begins a transaction on the database
     * @param model
     * @returns
     */
    startTransaction<T extends Model>(model: new () => T): Promise<MysqlTransaction> | Promise<PostgresTransaction>;
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
     * @description Closes the connection to the database
     * @returns
     */
    closeConnection(): Promise<void>;
    /**
     * @description Returns raw mysql PoolConnection
     */
    getRawPoolConnection(): Promise<SqlPoolConnectionType>;
}

export { BelongsTo, type DatasourceInput, HasMany, HasOne, Migration, Model, SqlDataSource };
