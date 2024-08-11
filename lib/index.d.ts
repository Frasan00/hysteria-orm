#!/usr/bin/env node
import * as mysql from 'mysql2/promise';
import mysql__default, { Pool, PoolConnection } from 'mysql2/promise';
import * as pg from 'pg';
import pg__default, { Pool as Pool$1, PoolClient } from 'pg';
import * as mysql2_typings_mysql_lib_protocol_packets_FieldPacket from 'mysql2/typings/mysql/lib/protocol/packets/FieldPacket';
import { DateTime } from 'luxon';

type DataSourceType = "mysql" | "postgres" | "mariadb";
/**
 * @description By default the connection details can be provided in the env.ts file, you can still override each prop with your actual connection details
 */
interface DataSourceInput {
    type?: DataSourceType;
    readonly host?: string;
    readonly port?: number;
    readonly username?: string;
    readonly password?: string;
    readonly database?: string;
    readonly logs?: boolean;
}
declare abstract class DataSource {
    protected type: DataSourceType;
    protected host: string;
    protected port: number;
    protected username: string;
    protected password: string;
    protected database: string;
    protected logs: boolean;
    protected constructor(input?: DataSourceInput);
}

declare class MysqlTransaction {
    protected mysql: Pool;
    protected mysqlConnection: PoolConnection;
    protected logs: boolean;
    constructor(mysql: Pool, logs: boolean);
    queryInsert<T extends Model>(query: string, params: any[], metadata: Metadata): Promise<T>;
    massiveInsertQuery<T extends Model>(query: string, params: any[], typeofModel: typeof Model): Promise<T[]>;
    massiveUpdateQuery(query: string, params: any[]): Promise<number>;
    massiveDeleteQuery(query: string, params: any[]): Promise<number>;
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
    protected pgPool: Pool$1;
    protected pgClient: PoolClient;
    protected logs: boolean;
    constructor(pgPool: Pool$1, logs: boolean);
    queryInsert<T extends Model>(query: string, params: any[], metadata: Metadata): Promise<T>;
    massiveInsertQuery<T extends Model>(query: string, params: any[], typeofModel: typeof Model): Promise<T[]>;
    massiveUpdateQuery<T extends Model>(query: string, params: any[], typeofModel: typeof Model): Promise<T[]>;
    massiveDeleteQuery<T extends Model>(query: string, params: any[], typeofModel: typeof Model): Promise<T[]>;
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

declare const selectTemplate: (table: string, dbType: DataSourceType) => {
    selectAll: string;
    selectById: (id: string) => string;
    selectColumns: (...columns: string[]) => string;
    selectCount: string;
    selectDistinct: (...columns: string[]) => string;
    selectSum: (column: string) => string;
    orderBy: (columns: string[], order?: "ASC" | "DESC") => string;
    groupBy: (...columns: string[]) => string;
    limit: (limit: number) => string;
    offset: (offset: number) => string;
};

type WhereOperatorType = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "ILIKE";
type BaseValues = string | number | boolean | object;
declare const whereTemplate: (_tableName: string, dbType: DataSourceType) => {
    convertPlaceHolderToValue: (query: string, startIndex?: number) => string;
    where: (column: string, value: BaseValues, operator?: WhereOperatorType) => {
        query: string;
        params: BaseValues[];
    };
    andWhere: (column: string, value: BaseValues, operator?: WhereOperatorType) => {
        query: string;
        params: BaseValues[];
    };
    orWhere: (column: string, value: BaseValues, operator?: WhereOperatorType) => {
        query: string;
        params: BaseValues[];
    };
    whereNot: (column: string, value: BaseValues) => {
        query: string;
        params: BaseValues[];
    };
    andWhereNot: (column: string, value: BaseValues) => {
        query: string;
        params: BaseValues[];
    };
    orWhereNot: (column: string, value: BaseValues) => {
        query: string;
        params: BaseValues[];
    };
    whereBetween: (column: string, min: BaseValues, max: BaseValues) => {
        query: string;
        params: BaseValues[];
    };
    andWhereBetween: (column: string, min: BaseValues, max: BaseValues) => {
        query: string;
        params: BaseValues[];
    };
    orWhereBetween: (column: string, min: BaseValues, max: BaseValues) => {
        query: string;
        params: BaseValues[];
    };
    whereNotBetween: (column: string, min: BaseValues, max: BaseValues) => {
        query: string;
        params: BaseValues[];
    };
    andWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => {
        query: string;
        params: BaseValues[];
    };
    orWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => {
        query: string;
        params: BaseValues[];
    };
    whereIn: (column: string, values: BaseValues[]) => {
        query: string;
        params: BaseValues[];
    };
    andWhereIn: (column: string, values: BaseValues[]) => {
        query: string;
        params: BaseValues[];
    };
    orWhereIn: (column: string, values: BaseValues[]) => {
        query: string;
        params: BaseValues[];
    };
    whereNotIn: (column: string, values: BaseValues[]) => {
        query: string;
        params: BaseValues[];
    };
    andWhereNotIn: (column: string, values: BaseValues[]) => {
        query: string;
        params: BaseValues[];
    };
    orWhereNotIn: (column: string, values: BaseValues[]) => {
        query: string;
        params: BaseValues[];
    };
    whereNull: (column: string) => {
        query: string;
        params: never[];
    };
    andWhereNull: (column: string) => {
        query: string;
        params: never[];
    };
    orWhereNull: (column: string) => {
        query: string;
        params: never[];
    };
    whereNotNull: (column: string) => {
        query: string;
        params: never[];
    };
    andWhereNotNull: (column: string) => {
        query: string;
        params: never[];
    };
    orWhereNotNull: (column: string) => {
        query: string;
        params: never[];
    };
    rawWhere: (query: string) => {
        query: string;
        params: never[];
    };
    rawAndWhere: (query: string) => {
        query: string;
        params: never[];
    };
    rawOrWhere: (query: string) => {
        query: string;
        params: never[];
    };
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

declare enum RelationType$1 {
    hasOne = "hasOne",// One to One without foreign key
    belongsTo = "belongsTo",// One to One with foreign key
    hasMany = "hasMany"
}
/**
 * Main Model -> Related Model
 */
declare abstract class Relation {
    abstract type: RelationType$1;
    foreignKey?: string;
    relatedModel: string;
    protected constructor(relatedModel: string);
}

declare class BelongsTo extends Relation {
    type: RelationType$1;
    foreignKey: string;
    constructor(relatedModel: string, foreignKey: string);
}

declare class HasMany extends Relation {
    type: RelationType$1;
    foreignKey: string;
    constructor(relatedModel: string, foreignKey: string);
}

declare class HasOne extends Relation {
    type: RelationType$1;
    foreignKey: string;
    constructor(relatedModel: string, foreignKey: string);
}

type ExcludeRelations<T> = {
    [K in keyof T]: T[K] extends (Model[] | HasMany) | (Model | HasMany) | (Model | BelongsTo) | (Model[] | BelongsTo) | (Model | HasOne) | (Model[] | HasOne) ? never : K;
}[keyof T];
type OnlyRelations<T> = {
    [K in keyof T]: T[K] extends (Model[] | HasMany) | (Model | HasMany) | (Model | BelongsTo) | (Model[] | BelongsTo) | (Model | HasOne) | (Model[] | HasOne) ? K : never;
}[keyof T];
type WhereType<T> = {
    [P in keyof T]?: string | number | boolean | Date | null;
};
type SelectableType<T> = ExcludeRelations<Omit<T, "extraColumns">>;
type RelationType<T> = OnlyRelations<Omit<T, "extraColumns">>;
type OrderByType = {
    columns: string[];
    type: "ASC" | "DESC";
};
type FindOneType<T> = {
    select?: SelectableType<T>[];
    relations?: RelationType<T>[];
    where?: WhereType<T>;
    throwErrorOnNull?: boolean;
};
type FindType<T> = Omit<FindOneType<T>, "throwError"> & {
    orderBy?: OrderByType;
    groupBy?: string[];
    limit?: number;
    offset?: number;
};
type TransactionType = MysqlTransaction | PostgresTransaction;

declare class MySqlModelManagerUtils<T extends Model> {
    parseInsert(model: T, modelTypeof: typeof Model): {
        query: string;
        params: any[];
    };
    parseMassiveInsert(models: T[], modelTypeOf: typeof Model): {
        query: string;
        params: any[];
    };
    parseUpdate(model: T, modelTypeof: typeof Model): {
        query: string;
        params: any[];
    };
    private filterRelationsAndMetadata;
    parseDelete(tableName: string, column: string, value: string | number | boolean): string;
    private getRelationFromModel;
    parseQueryBuilderRelations(model: T, modelTypeOf: typeof Model, input: string[], mysqlConnection: Pool, logs: boolean): Promise<void>;
}

declare class MysqlQueryBuilder<T extends Model> extends QueryBuilder<T> {
    protected mysqlPool: Pool;
    protected isNestedCondition: boolean;
    protected mysqlModelManagerUtils: MySqlModelManagerUtils<T>;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param mysqlPool - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, tableName: string, mysqlPool: Pool, logs: boolean, isNestedCondition?: boolean);
    /**
     * @description Executes the query and retrieves the first result.
     * @returns A Promise resolving to the first result or null.
     */
    one(options?: OneOptions): Promise<T | null>;
    /**
     * @description Executes the query and retrieves multiple results.
     * @returns A Promise resolving to an array of results.
     */
    many(): Promise<T[]>;
    raw(query: string, params?: any[]): Promise<[mysql.QueryResult, mysql2_typings_mysql_lib_protocol_packets_FieldPacket.FieldPacket[]]>;
    /**
     * @description Paginates the query results with the given page and limit, it removes any previous limit - offset calls
     * @param page
     * @param limit
     */
    paginate(page: number, limit: number): Promise<PaginatedData<T>>;
    select(...columns: (SelectableType<T> | "*")[]): MysqlQueryBuilder<T>;
    selectRaw(...columns: string[]): MysqlQueryBuilder<T>;
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
    addRelations(relations: RelationType<T>[]): MysqlQueryBuilder<T>;
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
    copy(): QueryBuilders<T>;
    mergeQueryBuilder(queryBuilder: MysqlQueryBuilder<T>): void;
    protected groupFooterQuery(): string;
    private mergeRawPacketIntoModel;
}

declare class PostgresModelManagerUtils<T extends Model> {
    parseInsert(model: T, modelTypeOf: typeof Model): {
        query: string;
        params: any[];
    };
    parseMassiveInsert(models: T[], modelTypeOf: typeof Model): {
        query: string;
        params: any[];
    };
    parseUpdate(model: T, modelTypeOf: typeof Model): {
        query: string;
        params: any[];
    };
    private filterRelationsAndMetadata;
    parseDelete(tableName: string, column: string, value: string | number | boolean): string;
    private getRelationFromModel;
    parseQueryBuilderRelations(model: T, modelTypeOf: typeof Model, input: string[], pgConnection: pg__default.Pool, logs: boolean): Promise<void>;
}

declare class PostgresQueryBuilder<T extends Model> extends QueryBuilder<T> {
    protected pgPool: Pool$1;
    protected isNestedCondition: boolean;
    protected postgresModelManagerUtils: PostgresModelManagerUtils<T>;
    constructor(model: typeof Model, tableName: string, pgPool: Pool$1, logs: boolean, isNestedCondition?: boolean);
    select(...columns: (SelectableType<T> | "*")[]): PostgresQueryBuilder<T>;
    selectRaw(...columns: string[]): PostgresQueryBuilder<T>;
    raw(query: string, params?: any[]): Promise<pg.QueryResult<any>>;
    one(options?: OneOptions): Promise<T | null>;
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
    addRelations(relations: RelationType<T>[]): PostgresQueryBuilder<T>;
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The PostgresQueryBuilder instance for chaining.
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
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    andWhere(column: string, value: BaseValues, operator?: WhereOperatorType): this;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    orWhere(column: string, value: BaseValues, operator?: WhereOperatorType): this;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    whereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    andWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    whereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    whereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    andWhereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    orWhereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    whereNotIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    orWhereNotIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds a WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    whereNull(column: string): this;
    /**
     * @description Adds an AND WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    andWhereNull(column: string): this;
    /**
     * @description Adds an OR WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    orWhereNull(column: string): this;
    /**
     * @description Adds a WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    whereNotNull(column: string): this;
    /**
     * @description Adds an AND WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    andWhereNotNull(column: string): this;
    /**
     * @description Adds an OR WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    orWhereNotNull(column: string): this;
    /**
     * @description Adds a raw WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    rawWhere(query: string): this;
    /**
     * @description Adds a raw AND WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    rawAndWhere(query: string): this;
    /**
     * @description Adds a raw OR WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    rawOrWhere(query: string): this;
    /**
     * @description Adds GROUP BY conditions to the query.
     * @param columns - The columns to group by.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    groupBy(...columns: string[]): this;
    /**
     * @description Adds ORDER BY conditions to the query.
     * @param column - The column to order by.
     * @param order - The order direction, either "ASC" or "DESC".
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    orderBy(column: string[], order: "ASC" | "DESC"): this;
    /**
     * @description Adds a LIMIT condition to the query.
     * @param limit - The maximum number of rows to return.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    limit(limit: number): this;
    /**
     * @description Adds an OFFSET condition to the query.
     * @param offset - The number of rows to skip.
     * @returns The PostgresQueryBuilder instance for chaining.
     */
    offset(offset: number): this;
    copy(): QueryBuilders<T>;
    protected groupFooterQuery(): string;
    private mergeRawPacketIntoModel;
}

declare abstract class WhereQueryBuilder<T extends Model> {
    protected whereQuery: string;
    protected whereParams: BaseValues[];
    protected model: typeof Model;
    protected tableName: string;
    protected logs: boolean;
    protected whereTemplate: ReturnType<typeof whereTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, tableName: string, logs: boolean, isNestedCondition?: boolean);
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    where(column: string, value: BaseValues, operator?: WhereOperatorType): this;
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
}

declare const updateTemplate: (table: string, dbType: DataSourceType) => {
    update: (columns: string[], values: string[], primaryKey?: string, primaryKeyValue?: string | undefined) => {
        query: string;
        params: (string | undefined)[];
    };
    massiveUpdate: (columns: string[], values: any[], whereClause: string, joinClause?: string) => {
        query: string;
        params: any[];
    };
};

declare class MysqlUpdateQueryBuilder<T extends Model> extends WhereQueryBuilder<T> {
    protected mysqlPool: Pool;
    protected joinQuery: string;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param mysqlPool - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, tableName: string, mysqlPool: Pool, logs: boolean, isNestedCondition?: boolean);
    /**
     * @description Updates a record in the database.
     * @param data - The data to update.
     * @param trx - The transaction to run the query in.
     * @returns The number of affected rows.
     */
    withData(data: Partial<T>, trx?: MysqlTransaction): Promise<number>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): MysqlUpdateQueryBuilder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): MysqlUpdateQueryBuilder<T>;
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
    whereBuilder(cb: (queryBuilder: MysqlUpdateQueryBuilder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: MysqlUpdateQueryBuilder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: MysqlUpdateQueryBuilder<T>) => void): this;
}

declare class PostgresUpdateQueryBuilder<T extends Model> extends WhereQueryBuilder<T> {
    protected pgPool: Pool$1;
    protected joinQuery: string;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param mysqlPool - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, tableName: string, pgPool: Pool$1, logs: boolean, isNestedCondition?: boolean);
    /**
     * @description Updates a record in the database.
     * @param data - The data to update.
     * @param trx - The transaction to run the query in.
     * @returns The updated records.
     */
    withData(data: Partial<T>, trx?: PostgresTransaction): Promise<T[]>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): PostgresUpdateQueryBuilder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): PostgresUpdateQueryBuilder<T>;
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
    whereBuilder(cb: (queryBuilder: PostgresUpdateQueryBuilder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: PostgresUpdateQueryBuilder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: PostgresUpdateQueryBuilder<T>) => void): this;
}

declare const deleteTemplate: (tableName: string, dbType: DataSourceType) => {
    delete: (column: string, value: string | number | boolean | Date) => string;
    massiveDelete: (whereClause: string, joinClause?: string) => string;
};

declare class MysqlDeleteQueryBuilder<T extends Model> extends WhereQueryBuilder<T> {
    protected mysql: Pool;
    protected joinQuery: string;
    protected deleteTemplate: ReturnType<typeof deleteTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param mysqlPool - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, tableName: string, mysql: Pool, logs: boolean, isNestedCondition?: boolean);
    /**
     * @description Deletes Records from the database.
     * @param data - The data to update.
     * @param trx - The transaction to run the query in.
     * @returns The updated records.
     */
    performDelete(trx?: MysqlTransaction): Promise<number>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): MysqlDeleteQueryBuilder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): MysqlDeleteQueryBuilder<T>;
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
    whereBuilder(cb: (queryBuilder: MysqlDeleteQueryBuilder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: MysqlDeleteQueryBuilder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: MysqlDeleteQueryBuilder<T>) => void): this;
}

declare class PostgresDeleteQueryBuilder<T extends Model> extends WhereQueryBuilder<T> {
    protected pgPool: Pool$1;
    protected joinQuery: string;
    protected deleteTemplate: ReturnType<typeof deleteTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param mysqlPool - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, tableName: string, pgPool: Pool$1, logs: boolean, isNestedCondition?: boolean);
    /**
     * @description Deletes Records from the database.
     * @param data - The data to update.
     * @param trx - The transaction to run the query in.
     * @returns The updated records.
     */
    performDelete(trx?: PostgresTransaction): Promise<T[]>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): PostgresDeleteQueryBuilder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): PostgresDeleteQueryBuilder<T>;
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
    whereBuilder(cb: (queryBuilder: PostgresDeleteQueryBuilder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: PostgresDeleteQueryBuilder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: PostgresDeleteQueryBuilder<T>) => void): this;
}

type QueryBuilders<T extends Model> = MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
type UpdateQueryBuilders<T extends Model> = MysqlUpdateQueryBuilder<T> | PostgresUpdateQueryBuilder<T>;
type DeleteQueryBuilders<T extends Model> = MysqlDeleteQueryBuilder<T> | PostgresDeleteQueryBuilder<T>;
type OneOptions = {
    throwErrorOnNull: boolean;
};
declare abstract class QueryBuilder<T extends Model> {
    protected selectQuery: string;
    protected joinQuery: string;
    protected relations: string[];
    protected whereQuery: string;
    protected groupByQuery: string;
    protected orderByQuery: string;
    protected limitQuery: string;
    protected offsetQuery: string;
    protected params: BaseValues[];
    protected model: typeof Model;
    protected tableName: string;
    protected logs: boolean;
    protected selectTemplate: ReturnType<typeof selectTemplate>;
    protected whereTemplate: ReturnType<typeof whereTemplate>;
    /**
     * @description Constructs a MysqlQueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param logs - A boolean indicating whether to log queries.
     */
    protected constructor(model: typeof Model, tableName: string, logs: boolean);
    /**
     * @description Executes the query and retrieves the first result.
     * @returns A Promise resolving to the first result or null.
     */
    abstract one(options: OneOptions): Promise<T | null>;
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
     * @description Executes the query and retrieves the results.
     * @returns
     */
    abstract raw(query: string): Promise<T | T[] | any>;
    /**
     * @description Can only select columns from the Model
     * @param columns
     */
    abstract select(...columns: (SelectableType<T> | "*")[]): QueryBuilders<T>;
    /**
     * @description Columns are customizable with aliases. By default, without this function, all columns are selected
     * @param columns
     */
    abstract selectRaw(...columns: string[]): QueryBuilders<T>;
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
    abstract addRelations(relations: RelationType<T>[]): QueryBuilders<T>;
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
    abstract groupBy(...columns: string[]): QueryBuilders<T>;
    /**
     * @description Adds ORDER BY conditions to the query.
     * @param column - The column to order by.
     * @param order - The order direction, either "ASC" or "DESC".
     * @returns The MysqlQueryBuilder instance for chaining.
     */
    abstract orderBy(column: string[], order: "ASC" | "DESC"): QueryBuilders<T>;
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
    /**
     * @description Returns a copy of the query builder instance.
     * @returns A copy of the query builder instance.
     */
    abstract copy(): QueryBuilders<T>;
    protected groupFooterQuery(): string;
}

declare abstract class AbstractModelManager<T extends Model> {
    protected logs: boolean;
    protected model: typeof Model;
    protected modelInstance: T;
    protected throwError: boolean;
    protected constructor(model: typeof Model, logs: boolean);
    abstract find(input?: FindType<T>): Promise<T[]>;
    abstract findOne(input: FindOneType<T>): Promise<T | null>;
    abstract findOneByPrimaryKey(value: string | number | boolean, throwErrorOnNull: boolean): Promise<T | null>;
    abstract create(model: Partial<T>, trx?: TransactionType): Promise<T | null>;
    abstract massiveCreate(model: Partial<T>[], trx?: TransactionType): Promise<T[]>;
    abstract updateRecord(model: T, trx?: TransactionType): Promise<T | null>;
    abstract deleteByColumn(column: string, value: string | number | boolean, trx?: TransactionType): Promise<number> | Promise<number | null>;
    abstract deleteRecord(model: T, trx?: TransactionType): Promise<T | null>;
    abstract query(): MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;
    abstract update(): MysqlUpdateQueryBuilder<T> | PostgresUpdateQueryBuilder<T>;
    abstract delete(): MysqlDeleteQueryBuilder<T> | PostgresDeleteQueryBuilder<T>;
}

declare class MysqlModelManager<T extends Model> extends AbstractModelManager<T> {
    protected mysqlPool: mysql__default.Pool;
    protected mysqlModelManagerUtils: MySqlModelManagerUtils<T>;
    /**
     * Constructor for MysqlModelManager class.
     *
     * @param {typeof Model} model - Model constructor.
     * @param {Pool} mysqlConnection - MySQL connection pool.
     * @param {boolean} logs - Flag to enable or disable logging.
     */
    constructor(model: typeof Model, mysqlConnection: mysql__default.Pool, logs: boolean);
    /**
     * Find method to retrieve multiple records from the database based on the input conditions.
     *
     * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
     * @returns Promise resolving to an array of models.
     */
    find(input?: FindType<T>): Promise<T[]>;
    /**
     * Find a single record from the database based on the input conditions.
     *
     * @param {FindOneType} input - Query parameters for filtering and selecting a single record.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOne(input: FindOneType<T>): Promise<T | null>;
    /**
     * Find a single record by its PK from the database.
     *
     * @param {string | number | boolean} value - PK of the record to retrieve.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOneByPrimaryKey(value: string | number | boolean, throwErrorOnNull?: boolean): Promise<T | null>;
    /**
     * Save a new model instance to the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
     * @returns Promise resolving to the saved model or null if saving fails.
     */
    create(model: T, trx?: TransactionType): Promise<T | null>;
    /**
     * Create multiple model instances in the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
     * @returns Promise resolving to an array of saved models or null if saving fails.
     */
    massiveCreate(models: T[], trx?: TransactionType): Promise<T[]>;
    /**
     * Update an existing model instance in the database.
     * @param {Model} model - Model instance to be updated.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the update operation.
     * @returns Promise resolving to the updated model or null if updating fails.
     */
    updateRecord(model: T, trx?: TransactionType): Promise<T | null>;
    /**
     * @description Delete a record from the database from the given column and value.
     *
     * @param {string} column - Column to filter by.
     * @param {string | number | boolean} value - Value to filter by.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
     * @returns Promise resolving to affected rows count
     */
    deleteByColumn(column: string, value: string | number | boolean, trx?: TransactionType): Promise<number>;
    /**
     * @description Delete a record from the database from the given model.
     *
     * @param {Model} model - Model to delete.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    deleteRecord(model: T, trx?: TransactionType): Promise<T | null>;
    /**
     * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
     *
     * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
     */
    query(): MysqlQueryBuilder<T>;
    /**
     * @description Returns an update query builder.
     */
    update(): MysqlUpdateQueryBuilder<T> | PostgresUpdateQueryBuilder<T>;
    /**
     * @description Returns a delete query builder.
     */
    delete(): MysqlDeleteQueryBuilder<T>;
}

declare class PostgresModelManager<T extends Model> extends AbstractModelManager<T> {
    protected pgPool: pg__default.Pool;
    protected postgresModelManagerUtils: PostgresModelManagerUtils<T>;
    /**
     * Constructor for PostgresModelManager class.
     *
     * @param {typeof Model} model - Model constructor.
     * @param {Pool} pgConnection - PostgreSQL connection pool.
     * @param {boolean} logs - Flag to enable or disable logging.
     */
    constructor(model: typeof Model, pgConnection: pg__default.Pool, logs: boolean);
    /**
     * Find method to retrieve multiple records from the database based on the input conditions.
     *
     * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
     * @returns Promise resolving to an array of models.
     */
    find(input?: FindType<T>): Promise<T[]>;
    /**
     * Find a single record from the database based on the input conditions.
     *
     * @param {FindOneType} input - Query parameters for filtering and selecting a single record.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOne(input: FindOneType<T>): Promise<T | null>;
    /**
     * Find a single record by its PK from the database.
     *
     * @param {string | number | boolean} value - PK value of the record to retrieve.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOneByPrimaryKey(value: string | number | boolean, throwErrorOnNull?: boolean): Promise<T | null>;
    /**
     * Save a new model instance to the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
     * @returns Promise resolving to the saved model or null if saving fails.
     */
    create(model: T, trx?: TransactionType): Promise<T | null>;
    /**
     * Create multiple model instances in the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {PostgresTransaction} trx - MysqlTransaction to be used on the save operation.
     * @returns Promise resolving to an array of saved models or null if saving fails.
     */
    massiveCreate(models: T[], trx?: TransactionType): Promise<T[]>;
    /**
     * Update an existing model instance in the database.
     * @param {Model} model - Model instance to be updated.
     * @param {PostgresTransaction} trx - PostgresTransaction to be used on the update operation.
     * @returns Promise resolving to the updated model or null if updating fails.
     */
    updateRecord(model: T, trx?: TransactionType): Promise<T | null>;
    /**
     * @description Delete a record from the database from the given column and value.
     *
     * @param {string} column - Column to filter by.
     * @param {string | number | boolean} value - Value to filter by.
     * @param {PostgresTransaction} trx - PostgresTransaction to be used on the delete operation.
     * @returns Promise resolving to affected rows count
     */
    deleteByColumn(column: string, value: string | number | boolean, trx?: TransactionType): Promise<number>;
    /**
     * @description Delete a record from the database from the given model.
     *
     * @param {Model} model - Model to delete.
     * @param {PostgresTransaction} trx - PostgresTransaction to be used on the delete operation.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    deleteRecord(model: T, trx?: TransactionType): Promise<T | null>;
    /**
     * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
     *
     * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
     */
    query(): PostgresQueryBuilder<T>;
    /**
     * @description Returns an update query builder.
     */
    update(): any;
    /**
     * @description Returns a delete query builder.
     */
    delete(): PostgresDeleteQueryBuilder<T>;
}

type ModelManager<T extends Model> = MysqlModelManager<T> | PostgresModelManager<T>;
type SqlPoolType = mysql__default.Pool | pg__default.Pool;
type SqlPoolConnectionType = mysql__default.PoolConnection | pg__default.PoolClient;
declare class SqlDataSource extends DataSource {
    isConnected: boolean;
    protected sqlPool: SqlPoolType;
    private static instance;
    private constructor();
    getDbType(): DataSourceType;
    /**
     * @description Connects to the database establishing a connection pool. If no connection details are provided, the default values from the env will be taken instead
     * @description The User input connection details will always come first
     */
    static connect(input?: DataSourceInput, cb?: () => void): Promise<SqlDataSource>;
    /**
     * @description Generates a temporary connection to the database, the instance will not be saved and cannot be accessed later in the getInstance method
     * @private
     * @internal
     */
    static tempConnect(input: DataSourceInput): Promise<SqlDataSource>;
    static getInstance(): SqlDataSource;
    /**
     * @description Begins a transaction on the database and returns the transaction object
     * @param model
     * @returns {Promise<MysqlTransaction | PostgresTransaction>} trx
     */
    startTransaction(): Promise<MysqlTransaction | PostgresTransaction>;
    /**
     * @description Returns model manager for the provided model
     * @param model
     */
    getModelManager<T extends Model>(model: typeof Model): ModelManager<T>;
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

interface Metadata {
    readonly tableName: string;
    readonly primaryKey?: string;
}
declare function column(): PropertyDecorator;
declare class Model {
    extraColumns: {
        [key: string]: string | number | boolean;
    };
    static sqlInstance: SqlDataSource;
    static metadata: Metadata;
    constructor(classProps?: Partial<Model>);
    /**
     * @description Connects to the database with the given connection details, then after the callback is executed, it disconnects from the database and connects back to the original database specified in the SqlDataSource.connect
     * @param connectionDetails - connection details for the database for the temp connection
     * @param cb - function containing all the database operations on the provided connection details
     * @experimental
     * @returns {Promise<void>}
     */
    static useConnection(connectionDetails: DataSourceInput, cb: (sqlDataSource: SqlDataSource) => Promise<void>): Promise<void>;
    /**
     * @description Gives a query instance for the given model
     * @param model
     * @returns {QueryBuilders<T>}
     */
    static query<T extends Model>(this: new () => T | typeof Model): QueryBuilders<T>;
    /**
     * @description Finds the first record in the database
     * @param model
     * @param {FindType} options
     * @returns {Promise<T[]>}
     */
    static first<T extends Model>(this: new () => T | typeof Model, options?: OneOptions): Promise<T | null>;
    /**
     * @description Finds records for the given model
     * @param model
     * @param {FindType} options
     * @returns {Promise<T[]>}
     */
    static find<T extends Model>(this: new () => T | typeof Model, options?: FindType<T>): Promise<T[]>;
    /**
     * @description Finds a record for the given model
     * @param model
     * @param {FindOneType} options
     * @returns {Promise<T | null>}
     */
    static findOne<T extends Model>(this: new () => T | typeof Model, options: FindOneType<T>): Promise<T | null>;
    /**
     * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
     * @param model
     * @param {number | string} id
     * @returns {Promise<T | null>}
     */
    static findOneByPrimaryKey<T extends Model>(this: new () => T | typeof Model, value: string | number | boolean, options?: {
        throwErrorOnNull: boolean;
    }): Promise<T | null>;
    /**
     * @description Saves a new record to the database
     * @param model
     * @param {Model} modelData
     * @param trx
     * @returns {Promise<T | null>}
     */
    static create<T extends Model>(this: new () => T | typeof Model, modelData: Partial<T>, trx?: MysqlTransaction | PostgresTransaction): Promise<T | null>;
    /**
     * @description Saves multiple records to the database
     * @param model
     * @param {Model} modelsData
     * @param trx
     * @returns {Promise<T[]>}
     */
    static massiveCreate<T extends Model>(this: new () => T | typeof Model, modelsData: Partial<T>[], trx?: MysqlTransaction | PostgresTransaction): Promise<T[]>;
    /**
     * @description Updates a record to the database
     * @param model
     * @param {Model} modelInstance
     * @param trx
     * @returns
     */
    static updateRecord<T extends Model>(this: new () => T | typeof Model, modelInstance: T, trx?: MysqlTransaction | PostgresTransaction): Promise<T | null>;
    /**
     * @description Updates records to the database
     * @param model
     * @param {Model} modelInstance
     * @param trx
     * @returns Update query builder
     */
    static update<T extends Model>(this: new () => T | typeof Model): UpdateQueryBuilders<T>;
    /**
     * @description Deletes multiple records from the database
     * @param model
     * @param {Model} modelInstance
     * @param trx
     * @returns
     */
    static delete<T extends Model>(this: new () => T | typeof Model): DeleteQueryBuilders<T>;
    /**
     * @description Deletes a record to the database
     * @param model
     * @param {Model} modelInstance
     * @param trx
     * @returns
     */
    static deleteRecord<T extends Model>(this: new () => T | typeof Model, modelInstance: T, trx?: MysqlTransaction | PostgresTransaction): Promise<T | null>;
    /**
     * @description Deletes a record to the database
     * @param model
     * @param {Model} modelInstance
     * @param {string} column
     * @param {string | number | boolean} value
     * @param trx
     * @returns
     */
    static deleteByColumn<T extends Model>(this: new () => T | typeof Model, column: string, value: string | number | boolean, trx?: MysqlTransaction | PostgresTransaction): Promise<number>;
    /**
     * @description Merges the provided data with the instance
     * @param instance
     * @param data
     * @returns {void}
     */
    static setProps<T extends Model>(instance: T, data: Partial<T>): void;
    /**
     * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
     * @param queryBuilder
     */
    static beforeFetch(queryBuilder: QueryBuilders<any>): QueryBuilders<any>;
    /**
     * @description Adds a beforeCreate clause to the model, adding the ability to modify the data after fetching the data
     * @param data
     * @returns {T}
     */
    static beforeCreate(data: Model): Model;
    /**
     * @description Adds a beforeUpdate clause to the model, adding the ability to modify the data before updating the data
     * @param data
     */
    static beforeUpdate(queryBuilder: UpdateQueryBuilders<any>): UpdateQueryBuilders<any>;
    /**
     * @description Adds a beforeDelete clause to the model, adding the ability to modify the data before deleting the data
     * @param data
     */
    static beforeDelete(queryBuilder: DeleteQueryBuilders<any>): DeleteQueryBuilders<any>;
    /**
     * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
     * @param data
     * @returns {T}
     */
    static afterFetch(data: Model[]): Promise<Model[]>;
    /**
     * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method
     * @returns
     */
    private static establishConnection;
}

declare class ColumnOptionsBuilder {
    protected tableName: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected columnName: string;
    protected columnReferences: {
        table: string;
        column: string;
    }[];
    protected sqlType: DataSourceType;
    constructor(tableName: string, queryStatements: string[], partialQuery: string, sqlType: DataSourceType, columnName?: string, columnReferences?: {
        table: string;
        column: string;
    }[]);
    /**
     * @description Makes the column nullable
     */
    nullable(): ColumnOptionsBuilder;
    default(value: string | number | boolean): ColumnOptionsBuilder;
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

type DateOptions = {
    autoCreate?: boolean;
    autoUpdate?: boolean;
};
declare class ColumnTypeBuilder {
    protected tableName: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected columnName: string;
    protected sqlType: DataSourceType;
    constructor(tableName: string, queryStatements: string[], partialQuery: string, sqlType: DataSourceType);
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
     * @description If using mysql, it will automatically add INT AUTO_INCREMENT
     * @param name
     */
    serial(name: string): ColumnOptionsBuilder;
    /**
     * @description If using mysql, it will automatically add BIGINT AUTO_INCREMENT
     * @param name
     */
    bigSerial(name: string): ColumnOptionsBuilder;
    integer(name: string): ColumnOptionsBuilder;
    bigint(name: string): ColumnOptionsBuilder;
    float(name: string): ColumnOptionsBuilder;
    decimal(name: string): ColumnOptionsBuilder;
    double(name: string): ColumnOptionsBuilder;
    boolean(name: string): ColumnOptionsBuilder;
    date(name: string, options?: DateOptions): ColumnOptionsBuilder;
    timestamp(name: string, options?: DateOptions): ColumnOptionsBuilder;
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
    protected sqlType: DataSourceType;
    constructor(tableName: string, queryStatements: string[], partialQuery: string, sqlType: DataSourceType);
    newColumn(): ColumnTypeBuilder;
}

type AlterOptions = {
    afterColumn?: string;
    references?: {
        table: string;
        column: string;
    };
};
type DataType = "varchar" | "tinytext" | "mediumtext" | "longtext" | "binary" | "text" | "char" | "tinyint" | "smallint" | "mediumint" | "integer" | "bigint" | "float" | "decimal" | "double" | "boolean" | "date" | "timestamp" | "jsonb";
type BaseOptions = {
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
} & DateOptions;
declare class ColumnBuilderAlter {
    protected tableName: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected sqlType: DataSourceType;
    constructor(tableName: string, queryStatements: string[], partialQuery: string, sqlType: DataSourceType);
    /**
     * @description Add a new column to the table
     * @param columnName { string }
     * @param dataType { varchar | tinytext | mediumtext | longtext | binary | text | char | tinyint | smallint | mediumint | integer | bigint | float | decimal | double | boolean | date | timestamp | jsonb }
     * @param options { afterColumn?: string; references?: { table: string; column: string }; default?: string; primaryKey?: boolean; unique?: boolean; notNullable?: boolean; autoIncrement?: boolean; length?: number; }
     */
    addColumn(columnName: string, dataType: DataType, options?: BaseOptions): ColumnBuilderAlter;
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
    modifyColumnType(columnName: string, newDataType: DataType, options?: BaseOptions): ColumnBuilderAlter;
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
     * @description Commits the changes - if omitted, the migration will be run empty
     */
    commit(): void;
}

declare class Schema {
    queryStatements: string[];
    sqlType: DataSourceType;
    constructor(sqlType?: DataSourceType);
    /**
     * @description Add raw query to the migration
     * @param query
     */
    rawQuery(query: string): void;
    createTable(tableName: string, options?: {
        ifNotExists?: boolean;
    }): ColumnBuilderConnector;
    /**
     * @description Alter table
     * @param tableName
     * @returns ColumnBuilderAlter
     */
    alterTable(tableName: string): ColumnBuilderAlter;
    /**
     * @description Drop table
     * @param tableName
     * @param ifExists
     * @returns void
     */
    dropTable(tableName: string, ifExists?: boolean): void;
    /**
     * @description Rename table
     * @param oldTableName
     * @param newTableName
     * @returns void
     */
    renameTable(oldTableName: string, newTableName: string): void;
    /**
     * @description Truncate table
     * @param tableName
     * @returns void
     */
    truncateTable(tableName: string): void;
    /**
     * @description Create index on table
     * @param tableName
     * @param indexName
     * @param columns
     * @param unique
     * @returns void
     */
    createIndex(tableName: string, indexName: string, columns: string[], unique?: boolean): void;
    /**
     * @description Drop index on table
     * @param tableName
     * @param indexName
     * @returns void
     */
    dropIndex(tableName: string, indexName: string): void;
    /**
     * @description Adds a primary key to a table
     * @param tableName
     * @param columnName
     * @param type
     * @param options
     * @returns void
     */
    addPrimaryKey(tableName: string, columns: string[]): void;
    /**
     * @description Drops a primary key from a table
     * @param tableName
     * @returns void
     */
    dropPrimaryKey(tableName: string): void;
    /**
     * @description Adds a foreign key to a table
     * @param tableName
     * @param constraintName
     * @param columns
     * @returns void
     */
    addConstraint(tableName: string, constraintName: string, columns: string[]): void;
    /**
     * @description Drops a cosntraint from a table
     * @param tableName
     * @param constraintName
     * @returns void
     */
    dropConstraint(tableName: string, constraintName: string): void;
    /**
     * @description Adds a unique constraint to a table
     * @param tableName
     * @param constraintName
     * @param columns
     * @returns void
     */
    addUniqueConstraint(tableName: string, constraintName: string, columns: string[]): void;
    /**
     * @description Drops a unique constraint from a table
     * @param tableName
     * @param constraintName
     * @returns void
     */
    dropUniqueConstraint(tableName: string, constraintName: string): void;
}

declare abstract class Migration {
    migrationName: string;
    schema: Schema;
    /**
     * @description This method is called when the migration is to be run
     */
    abstract up(): Promise<void>;
    /**
     * @description This method is called when the migration is to be rolled back
     */
    abstract down(): Promise<void>;
    /**
     * @description This method is called after the migration has been run
     */
    afterUp?(): Promise<void>;
    /**
     * @description This method is called after the migration has been rolled back
     */
    afterDown?(): Promise<void>;
}

declare class User extends Model {
    id: number;
    name: string;
    email: string;
    signupSource: string;
    isActive: boolean;
    json: Record<string, any>;
    createdAt: DateTime;
    updatedAt: DateTime;
    deletedAt: DateTime | null;
    posts: HasMany | Post[];
    static metadata: Metadata;
}
declare class Post extends Model {
    id: number;
    title: string;
    content: string;
    userId: number;
    user: BelongsTo | User;
    static metadata: Metadata;
}

export { BelongsTo, type DataSourceInput, type DeleteQueryBuilders, HasMany, HasOne, Migration, Model, Post, type QueryBuilders, Relation, SqlDataSource, type UpdateQueryBuilders, User, column };
