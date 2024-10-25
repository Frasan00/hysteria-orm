import mysql from 'mysql2/promise';
import pg, { Client } from 'pg';
import * as mongodb from 'mongodb';
import { MongoClientOptions } from 'mongodb';
import sqlite3 from 'sqlite3';
import { DateTime } from 'luxon';
import Redis, { RedisOptions } from 'ioredis';
export { RedisOptions } from 'ioredis';

type DataSourceType = "mysql" | "postgres" | "mariadb" | "sqlite" | "mongo";
/**
 * @description By default the connection details can be provided in the .env file, you can still override each prop with your actual connection details in the input
 */
interface DataSourceInput {
    type?: DataSourceType;
    readonly host?: string;
    readonly port?: number;
    readonly username?: string;
    readonly password?: string;
    readonly database?: string;
    readonly logs?: boolean;
    readonly mysqlOptions?: mysql.PoolOptions;
    readonly pgOptions?: pg.PoolConfig;
    readonly mongoOptions?: MongoClientOptions;
    /**
     * @description Mongo specific option, sql databases won't use this property
     */
    readonly url?: string;
}
declare abstract class DataSource {
    protected type: DataSourceType;
    protected host: string;
    protected port: number;
    protected username: string;
    protected password: string;
    protected database: string;
    protected url: string;
    logs: boolean;
    protected constructor(input?: DataSourceInput);
    protected handleMongoSource(url?: string): void;
    protected handleSqlSource(input?: DataSourceInput): void;
}

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

declare class Transaction {
    sqlDataSource: SqlDataSource;
    sqlConnection: SqlConnectionType;
    isActive: boolean;
    private readonly logs;
    constructor(sqlDataSource: SqlDataSource, logs?: boolean);
    startTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    private releaseConnection;
}

/**
 * @description Options for the relation
 * @property {string} softDeleteColumn - The column name for the soft delete column, if set, the relation will only return rows that have not been soft deleted
 * @property {string} softDeleteType - The type of the soft delete column
 */
interface RelationOptions {
    softDeleteColumn: string;
    softDeleteType: "date" | "boolean";
}
declare enum RelationEnum {
    hasOne = "hasOne",// One to One without foreign key
    belongsTo = "belongsTo",// One to One with foreign key
    hasMany = "hasMany"
}
/**
 * Main Model -> Related Model
 */
declare abstract class Relation {
    abstract type: RelationEnum;
    model: typeof Model;
    columnName: string;
    foreignKey?: string;
    relatedModel: string;
    options?: RelationOptions;
    protected constructor(model: typeof Model, columnName: string, options?: RelationOptions);
}

declare class BelongsTo extends Relation {
    type: RelationEnum;
    foreignKey: string;
    constructor(relatedModel: typeof Model, columnName: string, foreignKey: string, options?: RelationOptions);
}

declare class HasMany extends Relation {
    type: RelationEnum;
    foreignKey: string;
    constructor(relatedModel: typeof Model, columnName: string, foreignKey: string, options?: RelationOptions);
}

declare class HasOne extends Relation {
    type: RelationEnum;
    foreignKey: string;
    constructor(relatedModel: typeof Model, columnName: string, foreignKey: string, options?: RelationOptions);
}

type ExcludeRelations<T> = {
    [K in keyof T]: T[K] extends (Model[] | HasMany) | (Model | HasMany) | (Model | BelongsTo) | (Model[] | BelongsTo) | (Model | HasOne) | (Model[] | HasOne) | ((...args: any[]) => any) ? never : K;
}[keyof T];
type OnlyRelations<T> = {
    [K in keyof T]: T[K] extends (Model[] | HasMany) | (Model | HasMany) | (Model | BelongsTo) | (Model[] | BelongsTo) | (Model | HasOne) | (Model[] | HasOne) ? K : never;
}[keyof T];
type WhereType<T> = {
    [K in keyof T]?: string | number | boolean | Date | null;
};
type SelectableType<T> = ExcludeRelations<Omit<T, "$additionalColumns">>;
type RelationType<T> = OnlyRelations<Omit<T, "$additionalColumns">>;
type DynamicColumnType<T> = {
    [k in keyof T]: T[k] extends (...args: any[]) => any ? k : never;
}[keyof T];
type OrderByType = {
    [key: string]: "ASC" | "DESC";
};
type UnrestrictedFindOneType<T> = {
    select?: string[];
    relations?: RelationType<T>[];
    ignoreHooks?: FetchHooks$1[];
    dynamicColumns?: DynamicColumnType<T>;
    where?: Record<string, any>;
    orderBy?: OrderByType;
    groupBy?: string[];
    offset?: number;
};
type UnrestrictedFindType<T> = Omit<UnrestrictedFindOneType<T>, "throwErrorOnNull"> & {
    limit?: number;
};
type FindOneType<T> = {
    select?: SelectableType<T>[];
    offset?: number;
    relations?: RelationType<T>[];
    orderBy?: OrderByType;
    groupBy?: SelectableType<T>[];
    dynamicColumns?: DynamicColumnType<T>;
    where?: WhereType<T>;
    ignoreHooks?: FetchHooks$1[];
    useConnection?: SqlDataSource;
    trx?: Transaction;
};
type FindType<T> = Omit<FindOneType<T>, "throwErrorOnNull"> & {
    limit?: number;
};

declare class SqlModelManagerUtils<T extends Model> {
    private dbType;
    private sqlConnection;
    constructor(dbType: SqlDataSourceType, sqlConnection: SqlConnectionType);
    parseInsert(model: T, typeofModel: typeof Model, dbType: SqlDataSourceType): {
        query: string;
        params: any[];
    };
    parseMassiveInsert(models: T[], typeofModel: typeof Model, dbType: SqlDataSourceType): {
        query: string;
        params: any[];
    };
    parseUpdate(model: T, typeofModel: typeof Model, dbType: SqlDataSourceType): {
        query: string;
        params: any[];
    };
    private filterRelationsAndMetadata;
    parseDelete(table: string, column: string, value: string | number | boolean): {
        query: string;
        params: any[];
    };
    private getRelationFromModel;
    parseQueryBuilderRelations(models: T[], typeofModel: typeof Model, input: string[], logs: boolean): Promise<{
        [relationName: string]: Model[];
    }[]>;
    private getQueryResult;
}

type DeleteOptions = {
    ignoreBeforeDeleteHook?: boolean;
};
type SoftDeleteOptions<T> = {
    column?: SelectableType<T>;
    value?: string | number | boolean;
    ignoreBeforeDeleteHook?: boolean;
};

declare const deleteTemplate: (table: string, dbType: SqlDataSourceType) => {
    delete: (column: string, value: string | number | boolean | Date) => {
        query: string;
        params: (string | number | boolean | Date)[];
    };
    massiveDelete: (whereClause: string, joinClause?: string) => string;
};

declare const updateTemplate: (dbType: SqlDataSourceType, typeofModel: typeof Model) => {
    update: (columns: string[], values: any[], primaryKey?: string, primaryKeyValue?: string | undefined) => {
        query: string;
        params: any[];
    };
    massiveUpdate: (columns: string[], values: any[], whereClause: string, joinClause?: string) => {
        query: string;
        params: any[];
    };
};

type UpdateOptions = {
    ignoreBeforeUpdateHook?: boolean;
};

declare class MysqlQueryBuilder<T extends Model> extends QueryBuilder<T> {
    protected mysqlConnection: mysql.Connection;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected deleteTemplate: ReturnType<typeof deleteTemplate>;
    protected mysqlModelManagerUtils: SqlModelManagerUtils<T>;
    constructor(model: typeof Model, table: string, mysqlConnection: mysql.Connection, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    one(options?: OneOptions$1): Promise<T | null>;
    oneOrFail(options?: OneOptions$1 & {
        customError: Error;
    }): Promise<T>;
    many(options?: ManyOptions$1): Promise<T[]>;
    softDelete(options?: SoftDeleteOptions<T>): Promise<number>;
    delete(options?: DeleteOptions): Promise<number>;
    update(data: Partial<T>, options?: UpdateOptions): Promise<number>;
    whereBuilder(cb: (queryBuilder: MysqlQueryBuilder<T>) => void): this;
    orWhereBuilder(cb: (queryBuilder: MysqlQueryBuilder<T>) => void): this;
    andWhereBuilder(cb: (queryBuilder: MysqlQueryBuilder<T>) => void): this;
    getCount(options?: {
        ignoreHooks: boolean;
    }): Promise<number>;
    getSum(column: SelectableType<T>): Promise<number>;
    getSum(column: string): Promise<number>;
    paginate(page: number, limit: number, options?: ManyOptions$1): Promise<PaginatedData<T>>;
    select(...columns: string[]): MysqlQueryBuilder<T>;
    select(...columns: (SelectableType<T> | "*")[]): MysqlQueryBuilder<T>;
    joinRaw(query: string): this;
    join(relationTable: string, primaryColumn: string, foreignColumn: string): MysqlQueryBuilder<T>;
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): MysqlQueryBuilder<T>;
    addRelations(relations: RelationType<T>[]): MysqlQueryBuilder<T>;
    addDynamicColumns(dynamicColumns: DynamicColumnType<T>[]): ModelQueryBuilder<T>;
    groupBy(...columns: SelectableType<T>[]): this;
    groupBy(...columns: string[]): this;
    groupByRaw(query: string): this;
    orderBy(column: SelectableType<T>, order: "ASC" | "DESC"): this;
    orderBy(column: string, order: "ASC" | "DESC"): this;
    orderByRaw(query: string): this;
    limit(limit: number): this;
    offset(offset: number): this;
    havingRaw(query: string): ModelQueryBuilder<T>;
    copy(): ModelQueryBuilder<T>;
}

declare class PostgresQueryBuilder<T extends Model> extends QueryBuilder<T> {
    protected pgClient: Client;
    protected postgresModelManagerUtils: SqlModelManagerUtils<T>;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected deleteTemplate: ReturnType<typeof deleteTemplate>;
    constructor(model: typeof Model, table: string, pgClient: Client, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    select(...columns: string[]): PostgresQueryBuilder<T>;
    select(...columns: (SelectableType<T> | "*")[]): PostgresQueryBuilder<T>;
    one(options?: OneOptions$1): Promise<T | null>;
    oneOrFail(options?: OneOptions$1 & {
        customError: Error;
    }): Promise<T>;
    many(options?: ManyOptions$1): Promise<T[]>;
    update(data: Partial<T>, options?: UpdateOptions): Promise<number>;
    delete(options?: DeleteOptions): Promise<number>;
    softDelete(options?: SoftDeleteOptions<T>): Promise<number>;
    whereBuilder(cb: (queryBuilder: PostgresQueryBuilder<T>) => void): this;
    orWhereBuilder(cb: (queryBuilder: PostgresQueryBuilder<T>) => void): this;
    andWhereBuilder(cb: (queryBuilder: PostgresQueryBuilder<T>) => void): this;
    getCount(options?: {
        ignoreHooks: boolean;
    }): Promise<number>;
    getSum(column: SelectableType<T>): Promise<number>;
    getSum(column: string): Promise<number>;
    paginate(page: number, limit: number, options?: ManyOptions$1): Promise<PaginatedData<T>>;
    joinRaw(query: string): this;
    join(relationTable: string, primaryColumn: string, foreignColumn: string): PostgresQueryBuilder<T>;
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): PostgresQueryBuilder<T>;
    addRelations(relations: RelationType<T>[]): PostgresQueryBuilder<T>;
    addDynamicColumns(dynamicColumns: DynamicColumnType<T>[]): ModelQueryBuilder<T>;
    groupBy(...columns: SelectableType<T>[]): this;
    groupBy(...columns: string[]): this;
    groupByRaw(query: string): this;
    orderBy(column: SelectableType<T>, order: "ASC" | "DESC"): this;
    orderBy(column: string, order: "ASC" | "DESC"): this;
    orderByRaw(query: string): this;
    limit(limit: number): this;
    offset(offset: number): this;
    havingRaw(query: string): ModelQueryBuilder<T>;
    copy(): ModelQueryBuilder<T>;
}

declare const selectTemplate: (dbType: SqlDataSourceType, typeofModel: typeof Model) => {
    selectAll: string;
    selectById: (id: string) => string;
    selectByIds: (ids: string[]) => string;
    selectColumns: (...columns: string[]) => string;
    selectCount: string;
    selectDistinct: (...columns: string[]) => string;
    selectSum: (column: string) => string;
    _orderBy: (columns: string[], order?: "ASC" | "DESC") => string;
    groupBy: (...columns: string[]) => string;
    limit: (limit: number) => string;
    offset: (offset: number) => string;
};

declare class SqlLiteQueryBuilder<T extends Model> extends QueryBuilder<T> {
    protected sqLiteConnection: sqlite3.Database;
    protected sqliteModelManagerUtils: SqlModelManagerUtils<T>;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected deleteTemplate: ReturnType<typeof deleteTemplate>;
    constructor(model: typeof Model, table: string, sqLiteConnection: sqlite3.Database, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    one(options?: OneOptions$1): Promise<T | null>;
    oneOrFail(options?: OneOptions$1 & {
        customError: Error;
    }): Promise<T>;
    many(options?: ManyOptions$1): Promise<T[]>;
    update(data: Partial<T>, options?: UpdateOptions): Promise<number>;
    delete(options?: DeleteOptions): Promise<number>;
    softDelete(options?: SoftDeleteOptions<T>): Promise<number>;
    whereBuilder(cb: (queryBuilder: SqlLiteQueryBuilder<T>) => void): this;
    orWhereBuilder(cb: (queryBuilder: SqlLiteQueryBuilder<T>) => void): this;
    andWhereBuilder(cb: (queryBuilder: SqlLiteQueryBuilder<T>) => void): this;
    raw<T>(query: string, params?: any[]): Promise<T[]>;
    getCount(options?: {
        ignoreHooks: boolean;
    }): Promise<number>;
    getSum(column: SelectableType<T>): Promise<number>;
    getSum(column: string): Promise<number>;
    paginate(page: number, limit: number, options?: ManyOptions$1): Promise<PaginatedData<T>>;
    select(...columns: string[]): SqlLiteQueryBuilder<T>;
    select(...columns: (SelectableType<T> | "*")[]): SqlLiteQueryBuilder<T>;
    joinRaw(query: string): this;
    join(relationTable: string, primaryColumn: string, foreignColumn: string): SqlLiteQueryBuilder<T>;
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): SqlLiteQueryBuilder<T>;
    addRelations(relations: RelationType<T>[]): SqlLiteQueryBuilder<T>;
    addDynamicColumns(dynamicColumns: DynamicColumnType<T>[]): ModelQueryBuilder<T>;
    groupBy(...columns: SelectableType<T>[]): this;
    groupBy(...columns: string[]): this;
    groupByRaw(query: string): this;
    orderBy(column: SelectableType<T>, order: "ASC" | "DESC"): this;
    orderBy(column: string, order: "ASC" | "DESC"): this;
    orderByRaw(query: string): this;
    limit(limit: number): this;
    offset(offset: number): this;
    havingRaw(query: string): ModelQueryBuilder<T>;
    copy(): ModelQueryBuilder<T>;
    private promisifyQuery;
}

type BinaryOperatorType$1 = "=" | "!=" | "<>" | ">" | "<" | ">=" | "<=" | "LIKE" | "ILIKE" | "NOT LIKE" | "NOT ILIKE" | "IN" | "NOT IN" | "BETWEEN" | "NOT BETWEEN";
type BaseValues$1 = string | number | boolean | object;
declare const whereTemplate: (dbType: SqlDataSourceType, typeofModel: typeof Model) => {
    convertPlaceHolderToValue: (query: string, startIndex?: number) => string;
    where: (column: string, value: BaseValues$1, operator?: BinaryOperatorType$1) => {
        query: string;
        params: BaseValues$1[];
    };
    andWhere: (column: string, value: BaseValues$1, operator?: BinaryOperatorType$1) => {
        query: string;
        params: BaseValues$1[];
    };
    orWhere: (column: string, value: BaseValues$1, operator?: BinaryOperatorType$1) => {
        query: string;
        params: BaseValues$1[];
    };
    whereNot: (column: string, value: BaseValues$1) => {
        query: string;
        params: BaseValues$1[];
    };
    andWhereNot: (column: string, value: BaseValues$1) => {
        query: string;
        params: BaseValues$1[];
    };
    orWhereNot: (column: string, value: BaseValues$1) => {
        query: string;
        params: BaseValues$1[];
    };
    whereBetween: (column: string, min: BaseValues$1, max: BaseValues$1) => {
        query: string;
        params: BaseValues$1[];
    };
    andWhereBetween: (column: string, min: BaseValues$1, max: BaseValues$1) => {
        query: string;
        params: BaseValues$1[];
    };
    orWhereBetween: (column: string, min: BaseValues$1, max: BaseValues$1) => {
        query: string;
        params: BaseValues$1[];
    };
    whereNotBetween: (column: string, min: BaseValues$1, max: BaseValues$1) => {
        query: string;
        params: BaseValues$1[];
    };
    andWhereNotBetween: (column: string, min: BaseValues$1, max: BaseValues$1) => {
        query: string;
        params: BaseValues$1[];
    };
    orWhereNotBetween: (column: string, min: BaseValues$1, max: BaseValues$1) => {
        query: string;
        params: BaseValues$1[];
    };
    whereIn: (column: string, values: BaseValues$1[]) => {
        query: string;
        params: BaseValues$1[];
    };
    andWhereIn: (column: string, values: BaseValues$1[]) => {
        query: string;
        params: BaseValues$1[];
    };
    orWhereIn: (column: string, values: BaseValues$1[]) => {
        query: string;
        params: BaseValues$1[];
    };
    whereNotIn: (column: string, values: BaseValues$1[]) => {
        query: string;
        params: BaseValues$1[];
    };
    andWhereNotIn: (column: string, values: BaseValues$1[]) => {
        query: string;
        params: BaseValues$1[];
    };
    orWhereNotIn: (column: string, values: BaseValues$1[]) => {
        query: string;
        params: BaseValues$1[];
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
    rawWhere: (query: string, params: any[]) => {
        query: string;
        params: any[];
    };
    rawAndWhere: (query: string, params: any[]) => {
        query: string;
        params: any[];
    };
    rawOrWhere: (query: string, params: any[]) => {
        query: string;
        params: any[];
    };
    whereRegex: (column: string, regex: RegExp) => {
        query: string;
        params: string[];
    };
    andWhereRegex: (column: string, regex: RegExp) => {
        query: string;
        params: string[];
    };
    orWhereRegex: (column: string, regex: RegExp) => {
        query: string;
        params: string[];
    };
};

declare class WhereQueryBuilder<T extends Model> {
    protected sqlDataSource: SqlDataSource;
    protected whereQuery: string;
    protected params: BaseValues$1[];
    protected model: typeof Model;
    protected table: string;
    protected logs: boolean;
    protected whereTemplate: ReturnType<typeof whereTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a query_builder instance.
     */
    constructor(model: typeof Model, table: string, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    /**
     * @description Accepts a value and executes a callback only of the value is not null or undefined.
     */
    when(value: any, cb: (value: any, query: WhereQueryBuilder<T>) => void): this;
    /**
     * @description Adds a WHERE condition to the query.
     */
    where(column: SelectableType<T>, operator: BinaryOperatorType$1, value: BaseValues$1): this;
    where(column: string, operator: BinaryOperatorType$1, value: BaseValues$1): this;
    where(column: SelectableType<T> | string, value: BaseValues$1): this;
    /**
     * @description Adds an AND WHERE condition to the query.
     */
    andWhere(column: SelectableType<T>, operator: BinaryOperatorType$1, value: BaseValues$1): this;
    andWhere(column: string, operator: BinaryOperatorType$1, value: BaseValues$1): this;
    andWhere(column: SelectableType<T> | string, value: BaseValues$1): this;
    /**
     * @description Adds an OR WHERE condition to the query.
     */
    orWhere(column: SelectableType<T>, operator: BinaryOperatorType$1, value: BaseValues$1): this;
    orWhere(column: string, operator: BinaryOperatorType$1, value: BaseValues$1): this;
    orWhere(column: SelectableType<T> | string, value: BaseValues$1): this;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     */
    whereBetween(column: SelectableType<T>, min: BaseValues$1, max: BaseValues$1): this;
    whereBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     */
    andWhereBetween(column: SelectableType<T>, min: BaseValues$1, max: BaseValues$1): this;
    andWhereBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     */
    orWhereBetween(column: SelectableType<T>, min: BaseValues$1, max: BaseValues$1): this;
    orWhereBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     */
    whereNotBetween(column: SelectableType<T>, min: BaseValues$1, max: BaseValues$1): this;
    whereNotBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     */
    orWhereNotBetween(column: SelectableType<T>, min: BaseValues$1, max: BaseValues$1): this;
    orWhereNotBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds a WHERE IN condition to the query.
     */
    whereIn(column: SelectableType<T>, values: BaseValues$1[]): this;
    whereIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     */
    andWhereIn(column: SelectableType<T>, values: BaseValues$1[]): this;
    andWhereIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     */
    orWhereIn(column: SelectableType<T>, values: BaseValues$1[]): this;
    orWhereIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     */
    whereNotIn(column: SelectableType<T>, values: BaseValues$1[]): this;
    whereNotIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     */
    orWhereNotIn(column: SelectableType<T>, values: BaseValues$1[]): this;
    orWhereNotIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds a WHERE NULL condition to the query.
     */
    whereNull(column: SelectableType<T>): this;
    whereNull(column: string): this;
    /**
     * @description Adds an AND WHERE NULL condition to the query.
     */
    andWhereNull(column: SelectableType<T>): this;
    andWhereNull(column: string): this;
    /**
     * @description Adds an OR WHERE NULL condition to the query.
     */
    orWhereNull(column: SelectableType<T>): this;
    orWhereNull(column: string): this;
    /**
     * @description Adds a WHERE NOT NULL condition to the query.
     */
    whereNotNull(column: SelectableType<T>): this;
    whereNotNull(column: string): this;
    /**
     * @description Adds an AND WHERE NOT NULL condition to the query.
     */
    andWhereNotNull(column: SelectableType<T>): this;
    andWhereNotNull(column: string): this;
    /**
     * @description Adds an OR WHERE NOT NULL condition to the query.
     */
    orWhereNotNull(column: SelectableType<T>): this;
    orWhereNotNull(column: string): this;
    /**
     * @description Adds a WHERE REGEXP condition to the query.
     */
    whereRegexp(column: SelectableType<T>, regexp: RegExp): this;
    whereRegexp(column: string, regexp: RegExp): this;
    /**
     * @description Adds an AND WHERE REGEXP condition to the query.
     */
    andWhereRegexp(column: SelectableType<T>, regexp: RegExp): this;
    andWhereRegexp(column: string, regexp: RegExp): this;
    /**
     * @description Adds an OR WHERE REGEXP condition to the query.
     */
    orWhereRegexp(column: SelectableType<T>, regexp: RegExp): this;
    orWhereRegexp(column: string, regexp: RegExp): this;
    /**
     * @description Adds a raw WHERE condition to the query.
     */
    rawWhere(query: string, queryParams?: any[]): this;
    /**
     * @description Adds a raw AND WHERE condition to the query.
     */
    rawAndWhere(query: string, queryParams?: any[]): this;
    /**
     * @description Adds a raw OR WHERE condition to the query.
     */
    rawOrWhere(query: string, queryParams?: any[]): this;
}

/**
 * @description The abstract class for query builders for selecting data.
 */
type ModelQueryBuilder<T extends Model> = MysqlQueryBuilder<T> | PostgresQueryBuilder<T> | SqlLiteQueryBuilder<T>;
type FetchHooks$1 = "beforeFetch" | "afterFetch";
type OneOptions$1 = {
    ignoreHooks?: FetchHooks$1[];
};
type ManyOptions$1 = {
    ignoreHooks?: FetchHooks$1[];
};
declare abstract class QueryBuilder<T extends Model> extends WhereQueryBuilder<T> {
    protected selectQuery: string;
    protected modelSelectedColumns: string[];
    protected joinQuery: string;
    protected relations: string[];
    protected dynamicColumns: string[];
    protected groupByQuery: string;
    protected orderByQuery: string;
    protected limitQuery: string;
    protected offsetQuery: string;
    protected havingQuery: string;
    protected selectTemplate: ReturnType<typeof selectTemplate>;
    /**
     * @description Constructs a Mysql_query_builder instance.
     */
    protected constructor(model: typeof Model, table: string, logs: boolean, sqlDataSource: SqlDataSource);
    /**
     * @description Executes the query and retrieves the first result.
     */
    abstract one(options?: OneOptions$1): Promise<T | null>;
    /**
     * @description Executes the query and retrieves the first result.
     * @alias one
     */
    first(options?: OneOptions$1): Promise<T | null>;
    /**
     * @description Executes the query and retrieves the first result. Fail if no result is found.
     */
    abstract oneOrFail(options?: {
        ignoreHooks?: OneOptions$1["ignoreHooks"] & {
            customError?: Error;
        };
    }): Promise<T>;
    /**
     * @description Executes the query and retrieves the first result. Fail if no result is found.
     * @alias oneOrFail
     */
    firstOrFail(options?: {
        ignoreHooks?: OneOptions$1["ignoreHooks"] & {
            customError?: Error;
        };
    }): Promise<T>;
    /**
     * @description Executes the query and retrieves multiple results.
     */
    abstract many(options: ManyOptions$1): Promise<T[]>;
    /**
     * @description Updates records in the database.
     */
    abstract update(data: Partial<T>, options?: UpdateOptions): Promise<number>;
    /**
     * @description soft Deletes Records from the database.
     * @default column - 'deletedAt'
     * @default value - The current date and time.
     * @default ignoreBeforeDeleteHook - false
     * @default trx - undefined
     */
    abstract softDelete(options?: SoftDeleteOptions<T>): Promise<number>;
    /**
     * @description Deletes Records from the database for the current query.
     */
    abstract delete(options?: DeleteOptions): Promise<number>;
    /**
     * @description Executes the query and retrieves the count of results, it ignores all select, group by, order by, limit and offset clauses if they are present.
     */
    abstract getCount(options: {
        ignoreHooks: boolean;
    }): Promise<number>;
    /**
     * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
     */
    abstract getSum(column: string, options: {
        ignoreHooks: boolean;
    }): Promise<number>;
    /**
     * @description Executes the query and retrieves multiple results.
     */
    abstract paginate(page: number, limit: number, options?: ManyOptions$1): Promise<PaginatedData<T>>;
    /**
     * @description Adds a SELECT condition to the query.
     */
    abstract select(...columns: string[]): ModelQueryBuilder<T>;
    abstract select(...columns: (SelectableType<T> | "*")[]): ModelQueryBuilder<T>;
    abstract select(...columns: (SelectableType<T> | "*" | string)[]): ModelQueryBuilder<T>;
    /**
     * @description Adds a JOIN condition to the query.
     */
    abstract join(table: string, primaryColumn: string, foreignColumn: string): ModelQueryBuilder<T>;
    /**
     * @description Adds a raw JOIN condition to the query.
     */
    abstract joinRaw(query: string): QueryBuilder<T>;
    /**
     * @description Adds a LEFT JOIN condition to the query.
     */
    abstract leftJoin(table: string, primaryColumn: string, foreignColumn: string): ModelQueryBuilder<T>;
    /**
     * @description Adds a relation to the query.
     */
    abstract addRelations(relations: RelationType<T>[]): ModelQueryBuilder<T>;
    /**
     * @description Adds a the selected dynamic columns from the model into the final model
     */
    abstract addDynamicColumns(dynamicColumns: DynamicColumnType<T>[]): ModelQueryBuilder<T>;
    /**
     * @description Build more complex where conditions.
     */
    abstract whereBuilder(cb: (queryBuilder: ModelQueryBuilder<T>) => void): ModelQueryBuilder<T>;
    /**
     * @description Build more complex where conditions.
     */
    abstract andWhereBuilder(cb: (queryBuilder: ModelQueryBuilder<T>) => void): ModelQueryBuilder<T>;
    /**
     * @description Build more complex where conditions.
     */
    abstract orWhereBuilder(cb: (queryBuilder: ModelQueryBuilder<T>) => void): ModelQueryBuilder<T>;
    /**
     * @description Adds GROUP BY conditions to the query.
     */
    abstract groupBy(...columns: SelectableType<T>[]): ModelQueryBuilder<T>;
    abstract groupBy(...columns: string[]): ModelQueryBuilder<T>;
    abstract groupBy(...columns: (SelectableType<T> | string)[]): ModelQueryBuilder<T>;
    /**
     * @description Adds a raw GROUP BY condition to the query, only one raw GROUP BY condition is stackable, the last one will be used.
     */
    abstract groupByRaw(query: string): ModelQueryBuilder<T>;
    /**
     * @description Adds ORDER BY conditions to the query.
     */
    abstract orderBy(column: SelectableType<T>, order: "ASC" | "DESC"): ModelQueryBuilder<T>;
    abstract orderBy(column: string, order: "ASC" | "DESC"): ModelQueryBuilder<T>;
    abstract orderBy(column: SelectableType<T> | string, order: "ASC" | "DESC"): ModelQueryBuilder<T>;
    /**
     * @description Adds a raw ORDER BY condition to the query, only one raw ORDER BY condition is stackable, the last one will be used.
     * @description ORDER BY is implicitly added to the query.
     */
    abstract orderByRaw(query: string): ModelQueryBuilder<T>;
    /**
     * @description Adds a LIMIT condition to the query.
     */
    abstract limit(limit: number): ModelQueryBuilder<T>;
    /**
     * @description Adds an OFFSET condition to the query.
     */
    abstract offset(offset: number): ModelQueryBuilder<T>;
    /**
     * @description Adds a raw HAVING condition to the query, only one raw HAVING condition is stackable, the last one will be used.
     */
    abstract havingRaw(query: string): ModelQueryBuilder<T>;
    /**
     * @description Returns a copy of the query builder instance.
     */
    abstract copy(): ModelQueryBuilder<T>;
    /**
     * @description Returns the query and the parameters in an object.
     */
    toSql(): {
        query: string;
        params: any[];
    };
    protected groupFooterQuery(): string;
    protected mergeRawPacketIntoModel(model: T, row: any, typeofModel: typeof Model): Promise<void>;
}

type CaseConvention = "camel" | "snake" | "none" | RegExp | ((column: string) => string);

/**
 * @description The most basic class for all models for both SQL and NoSQL databases
 * @internal Not meant to be used outside of the library
 */
declare abstract class Entity {
    /**
     * @description Extra columns for the model, all data retrieved from the database that is not part of the model will be stored here
     */
    $additionalColumns: {
        [key: string]: any;
    };
    /**
     * @description Defines the case convention for the model
     * @type {CaseConvention}
     */
    static modelCaseConvention: CaseConvention;
    /**
     * @description Defines the case convention for the database, this should be the case convention you use in your database
     * @type {CaseConvention}
     */
    static databaseCaseConvention: CaseConvention;
    constructor();
}

type BaseModelMethodOptions$1 = {
    useConnection?: SqlDataSource;
    trx?: Transaction;
};
/**
 * @description Represents a Table in the Database
 */
declare abstract class Model extends Entity {
    /**
     * @description The sql sqlInstance generated by SqlDataSource.connect
     */
    static sqlInstance: SqlDataSource;
    /**
     * @description Table name for the model, if not set it will be the plural snake case of the model name given that is in PascalCase (es. User -> users)
     */
    static tableName: string;
    /**
     * @description Static getter for table;
     * @internal
     */
    static get table(): string;
    /**
     * @description Getter for the primary key of the model
     */
    static get primaryKey(): string | undefined;
    /**
     * @description Constructor for the model, it's not meant to be used directly, it just initializes the $additionalColumns, it's advised to only use the static methods to interact with the database to save the model
     */
    constructor();
    /**
     * @description Returns all the records for the given model
     */
    static all<T extends Model>(this: new () => T | typeof Model, options?: BaseModelMethodOptions$1): Promise<T[]>;
    /**
     * @description Gives a query sqlInstance for the given model
     */
    static query<T extends Model>(this: new () => T | typeof Model, options?: BaseModelMethodOptions$1): ModelQueryBuilder<T>;
    /**
     * @description Finds the first record in the database
     * @deprecated Used only for debugging purposes, use findOne or query instead
     */
    static first<T extends Model>(this: new () => T | typeof Model, options?: OneOptions$1 & BaseModelMethodOptions$1): Promise<T | null>;
    /**
     * @description Finds records for the given model
     */
    static find<T extends Model>(this: new () => T | typeof Model, findOptions?: FindType<T> | UnrestrictedFindType<T>, options?: BaseModelMethodOptions$1): Promise<T[]>;
    /**
     * @description Finds a record for the given model or throws an error if it doesn't exist
     */
    static findOneOrFail<T extends Model>(this: new () => T | typeof Model, findOneOptions: (FindOneType<T> | UnrestrictedFindOneType<T>) & {
        customError?: Error;
    }, options?: BaseModelMethodOptions$1): Promise<T | null>;
    /**
     * @description Finds a record for the given model
     */
    static findOne<T extends Model>(this: new () => T | typeof Model, findOneOptions: (FindOneType<T> | UnrestrictedFindOneType<T>) & BaseModelMethodOptions$1, options?: BaseModelMethodOptions$1): Promise<T | null>;
    /**
     * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
     */
    static findOneByPrimaryKey<T extends Model>(this: new () => T | typeof Model, value: string | number | boolean, options?: BaseModelMethodOptions$1): Promise<T | null>;
    /**
     * @description Refreshes a model from the database, the model must have a primary key defined
     */
    static refresh<T extends Model>(this: new () => T | typeof Model, model: T, options?: BaseModelMethodOptions$1): Promise<T | null>;
    /**
     * @description Saves a new record to the database
     */
    static insert<T extends Model>(this: new () => T | typeof Model, modelData: Partial<T>, options?: BaseModelMethodOptions$1): Promise<T | null>;
    /**
     * @description Saves multiple records to the database
     * @description WHile using mysql, it will return records only if the primary key is auto incrementing integer, else it will always return []
     */
    static insertMany<T extends Model>(this: new () => T | typeof Model, modelsData: Partial<T>[], options?: BaseModelMethodOptions$1): Promise<T[]>;
    /**
     * @description Updates a record to the database
     */
    static updateRecord<T extends Model>(this: new () => T | typeof Model, modelSqlInstance: T, options?: BaseModelMethodOptions$1): Promise<T | null>;
    /**
     * @description Finds the first record or creates a new one if it doesn't exist
     */
    static firstOrCreate<T extends Model>(this: new () => T | typeof Model, searchCriteria: Partial<T>, createData: Partial<T>, options?: BaseModelMethodOptions$1): Promise<T>;
    /**
     * @description Updates or creates a new record
     */
    static upsert<T extends Model>(this: new () => T | typeof Model, searchCriteria: Partial<T>, data: Partial<T>, options?: {
        updateOnConflict?: boolean;
    } & BaseModelMethodOptions$1): Promise<T>;
    /**
     * @description Updates or creates multiple records
     */
    static upsertMany<T extends Model>(this: new () => T | typeof Model, searchCriteria: SelectableType<T>[], data: Partial<T>[], options?: {
        updateOnConflict?: boolean;
    } & BaseModelMethodOptions$1): Promise<T[]>;
    /**
     * @description Deletes a record to the database
     */
    static deleteRecord<T extends Model>(this: new () => T | typeof Model, modelSqlInstance: T, options?: BaseModelMethodOptions$1): Promise<T | null>;
    /**
     * @description Soft Deletes a record to the database
     */
    static softDelete<T extends Model>(this: new () => T | typeof Model, modelSqlInstance: T, options?: {
        column?: string;
        value?: string | number | boolean;
    } & BaseModelMethodOptions$1): Promise<T>;
    /**
     * @description Adds dynamic columns to the model that are not defined in the Table and are defined in the model
     * @description It does not support custom connection or transaction
     */
    static addDynamicColumns<T extends Model>(this: new () => T | typeof Model, data: T | T[] | PaginatedData<T>, dynamicColumns: DynamicColumnType<T>[]): Promise<T | T[] | PaginatedData<T>>;
    /**
     * @description Merges the provided data with the sqlInstance
     */
    static combineProps<T extends Model>(sqlInstance: T, data: Partial<T>): void;
    /**
     * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
     */
    static beforeFetch(queryBuilder: ModelQueryBuilder<any>): void;
    /**
     * @description Adds a beforeInsert clause to the model, adding the ability to modify the data after fetching the data
     */
    static beforeInsert(data: any): void;
    /**
     * @description Adds a beforeUpdate clause to the model, adding the ability to modify the query before updating the data
     */
    static beforeUpdate(queryBuilder: ModelQueryBuilder<any>): void;
    /**
     * @description Adds a beforeDelete clause to the model, adding the ability to modify the query before deleting the data
     */
    static beforeDelete(queryBuilder: ModelQueryBuilder<any>): void;
    /**
     * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
     */
    static afterFetch(data: Model[]): Promise<Model[]>;
    /**
     * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method, this is done automatically when using the static methods
     * @description This method is meant to be used only if you want to establish sql sqlInstance of the model directly
     * @internal
     */
    private static establishConnection;
    /**
     * @description Gives the correct model manager with the correct connection based on the options provided
     */
    private static dispatchModelManager;
}

declare abstract class ModelManager$1<T extends Model> {
    protected logs: boolean;
    protected sqlDataSource: SqlDataSource;
    protected model: typeof Model;
    protected modelInstance: T;
    protected throwError: boolean;
    /**
     * @param model
     * @param logs
     * @param sqlDataSource Passed if a custom connection is provided
     */
    protected constructor(model: typeof Model, logs: boolean, sqlDataSource: SqlDataSource);
    /**
     * @description Finds all records that match the input
     * @param input
     */
    abstract find(input?: FindType<T>): Promise<T[]>;
    abstract find(input?: UnrestrictedFindType<T>): Promise<T[]>;
    abstract find(input?: FindType<T> | UnrestrictedFindType<T>): Promise<T[]>;
    /**
     * @description Finds the first record that matches the input
     * @param input
     */
    abstract findOne(input: UnrestrictedFindOneType<T>): Promise<T | null>;
    abstract findOne(input: FindOneType<T>): Promise<T | null>;
    abstract findOne(input: FindOneType<T> | UnrestrictedFindOneType<T>): Promise<T | null>;
    /**
     * @description Finds the first record that matches the input or throws an error
     */
    findOneOrFail(input: (FindOneType<T> | UnrestrictedFindOneType<T>) & {
        customError?: Error;
    }): Promise<T>;
    /**
     * @description Finds a record by its primary key
     * @param value
     * @param throwErrorOnNull
     */
    abstract findOneByPrimaryKey(value: string | number | boolean, throwErrorOnNull: boolean): Promise<T | null>;
    /**
     * @description Creates a new record
     * @param model
     * @param trx
     */
    abstract insert(model: Partial<T>): Promise<T | null>;
    /**
     * @description Creates multiple records
     * @param model
     * @param trx
     */
    abstract insertMany(model: Partial<T>[]): Promise<T[]>;
    /**
     * @description Updates a record
     * @param model
     * @param trx
     */
    abstract updateRecord(model: T): Promise<T | null>;
    /**
     * @description Deletes a record
     * @param model
     * @param trx
     */
    abstract deleteRecord(model: T): Promise<T | null>;
    /**
     * @description Returns a query builder
     */
    abstract query(): QueryBuilder<T>;
}

declare class MysqlModelManager<T extends Model> extends ModelManager$1<T> {
    protected mysqlConnection: mysql.Connection;
    protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
    /**
     * Constructor for MysqlModelManager class.
     *
     * @param {typeof Model} model - Model constructor.
     * @param {Connection} mysqlConnection - MySQL connection pool.
     * @param {boolean} logs - Flag to enable or disable logging.
     */
    constructor(model: typeof Model, mysqlConnection: mysql.Connection, logs: boolean, sqlDataSource: SqlDataSource);
    /**
     * Find method to retrieve multiple records from the database based on the input conditions.
     *
     * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
     * @returns Promise resolving to an array of models.
     */
    find(input?: FindType<T> | UnrestrictedFindType<T>): Promise<T[]>;
    /**
     * Find a single record from the database based on the input conditions.
     *
     * @param {FindOneType} input - query parameters for filtering and selecting a single record.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOne(input: FindOneType<T> | UnrestrictedFindOneType<T>): Promise<T | null>;
    /**
     * Find a single record by its PK from the database.
     *
     * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOneByPrimaryKey(value: string | number | boolean): Promise<T | null>;
    /**
     * Save a new model instance to the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {TransactionType} trx - TransactionType to be used on the save operation.
     * @returns Promise resolving to the saved model or null if saving fails.
     */
    insert(model: Partial<T>): Promise<T | null>;
    /**
     * Create multiple model instances in the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {TransactionType} trx - TransactionType to be used on the save operation.
     * @returns Promise resolving to an array of saved models or null if saving fails.
     */
    insertMany(models: Partial<T>[]): Promise<T[]>;
    /**
     * Update an existing model instance in the database.
     * @param {Model} model - Model instance to be updated.
     * @param {TransactionType} trx - TransactionType to be used on the update operation.
     * @returns Promise resolving to the updated model or null if updating fails.
     */
    updateRecord(model: T): Promise<T | null>;
    /**
     * @description Delete a record from the database from the given model.
     *
     * @param {Model} model - Model to delete.
     * @param {TransactionType} trx - TransactionType to be used on the delete operation.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    deleteRecord(model: T): Promise<T | null>;
    /**
     * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
     *
     * @returns {Mysql_query_builder<Model>} - Instance of Mysql_query_builder.
     */
    query(): MysqlQueryBuilder<T>;
}

declare class PostgresModelManager<T extends Model> extends ModelManager$1<T> {
    protected pgConnection: pg.Client;
    protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
    /**
     * Constructor for Postgres_model_manager class.
     *
     * @param {typeof Model} model - Model constructor.
     * @param {Pool} pgConnection - PostgreSQL connection pool.
     * @param {boolean} logs - Flag to enable or disable logging.
     */
    constructor(model: typeof Model, pgConnection: pg.Client, logs: boolean, sqlDataSource: SqlDataSource);
    /**
     * Find method to retrieve multiple records from the database based on the input conditions.
     *
     * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
     * @returns Promise resolving to an array of models.
     */
    find(input?: FindType<T> | UnrestrictedFindType<T>): Promise<T[]>;
    /**
     * Find a single record from the database based on the input conditions.
     *
     * @param {FindOneType} input - query parameters for filtering and selecting a single record.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOne(input: FindOneType<T> | UnrestrictedFindOneType<T>): Promise<T | null>;
    /**
     * Find a single record by its PK from the database.
     *
     * @param {string | number | boolean} value - PK value of the record to retrieve.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOneByPrimaryKey(value: string | number | boolean): Promise<T | null>;
    /**
     * Save a new model instance to the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
     * @returns Promise resolving to the saved model or null if saving fails.
     */
    insert(model: Partial<T>): Promise<T | null>;
    /**
     * Create multiple model instances in the database.
     *
     * @param {Model} models - Model instance to be saved.
     * @param {Transaction} trx - MysqlTransaction to be used on the save operation.
     * @returns Promise resolving to an array of saved models or null if saving fails.
     */
    insertMany(models: Partial<T>[]): Promise<T[]>;
    /**
     * Update an existing model instance in the database.
     * @param {Model} model - Model instance to be updated.
     * @param {Transaction} trx - Transaction to be used on the update operation.
     * @returns Promise resolving to the updated model or null if updating fails.
     */
    updateRecord(model: T): Promise<T | null>;
    /**
     * @description Delete a record from the database from the given model.
     *
     * @param {Model} model - Model to delete.
     * @param {Transaction} trx - Transaction to be used on the delete operation.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    deleteRecord(model: T): Promise<T | null>;
    /**
     * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
     *
     * @returns {MysqlQueryBuilder<Model>} - Instance of Mysql_query_builder.
     */
    query(): PostgresQueryBuilder<T>;
}

declare class SqliteModelManager<T extends Model> extends ModelManager$1<T> {
    protected sqLiteConnection: sqlite3.Database;
    protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
    /**
     * Constructor for SqLiteModelManager class.
     *
     * @param {typeof Model} model - Model constructor.
     * @param {Pool} sqLiteConnection - sqlite connection.
     * @param {boolean} logs - Flag to enable or disable logging.
     */
    constructor(model: typeof Model, sqLiteConnection: sqlite3.Database, logs: boolean, sqlDataSource: SqlDataSource);
    /**
     * Find method to retrieve multiple records from the database based on the input conditions.
     *
     * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
     * @returns Promise resolving to an array of models.
     */
    find(input?: FindType<T> | UnrestrictedFindType<T>): Promise<T[]>;
    /**
     * Find a single record from the database based on the input conditions.
     *
     * @param {FindOneType} input - query parameters for filtering and selecting a single record.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOne(input: FindOneType<T> | UnrestrictedFindOneType<T>): Promise<T | null>;
    /**
     * Find a single record by its PK from the database.
     *
     * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
     * @returns Promise resolving to a single model or null if not found.
     */
    findOneByPrimaryKey(value: string | number | boolean): Promise<T | null>;
    /**
     * Save a new model instance to the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {SqliteTransaction} trx - SqliteTransaction to be used on the save operation.
     * @returns Promise resolving to the saved model or null if saving fails.
     */
    insert(model: Partial<T>): Promise<T | null>;
    /**
     * Create multiple model instances in the database.
     *
     * @param {Model} model - Model instance to be saved.
     * @param {SqliteTransaction} trx - SqliteTransaction to be used on the save operation.
     * @returns Promise resolving to an array of saved models or null if saving fails.
     */
    insertMany(models: Partial<T>[]): Promise<T[]>;
    /**
     * Update an existing model instance in the database.
     * @param {Model} model - Model instance to be updated.
     * @param {SqliteTransaction} trx - SqliteTransaction to be used on the update operation.
     * @returns Promise resolving to the updated model or null if updating fails.
     */
    updateRecord(model: T): Promise<T | null>;
    /**
     * @description Delete a record from the database from the given model.
     *
     * @param {Model} model - Model to delete.
     * @param trx - SqliteTransaction to be used on the delete operation.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    deleteRecord(model: T): Promise<T | null>;
    /**
     * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
     *
     * @returns {MysqlQueryBuilder<Model>} - Instance of Mysql_query_builder.
     */
    query(): SqlLiteQueryBuilder<T>;
    private promisifyQuery;
}

type DriverSpecificOptions = {
    mysqlOptions?: mysql.PoolOptions;
    pgOptions?: pg.PoolConfig;
};
type ModelManager<T extends Model> = MysqlModelManager<T> | PostgresModelManager<T> | SqliteModelManager<T>;
type SqlConnectionType = mysql.Connection | pg.Client | sqlite3.Database;
interface ISqlDataSourceInput extends DataSourceInput {
    type: Exclude<DataSourceType, "mongo">;
}
type SqlDataSourceInput = Exclude<ISqlDataSourceInput, "mongoOptions">;
type SqlDataSourceType = SqlDataSourceInput["type"];
declare class SqlDataSource extends DataSource {
    isConnected: boolean;
    protected sqlConnection: SqlConnectionType;
    private static instance;
    private constructor();
    getDbType(): SqlDataSourceType;
    /**
     * @description Connects to the database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
     * @description The User input connection details will always come first
     */
    static connect(input?: SqlDataSourceInput, cb?: () => Promise<void> | void): Promise<SqlDataSource>;
    static getInstance(): SqlDataSource;
    /**
     * @description Executes a callback function with the provided connection details
     * @description The callback automatically commits or rollbacks the transaction based on the result of the callback
     * @description NOTE: trx must always be passed to single methods that are part of the transaction
     */
    useTransaction(cb: (trx: Transaction) => Promise<void>, driverSpecificOptions?: DriverSpecificOptions): Promise<void>;
    /**
     * @description Starts a transaction on the database and returns the transaction object
     * @description This creates a new connection to the database, you can customize the connection details using the driverSpecificOptions
     */
    startTransaction(driverSpecificOptions?: DriverSpecificOptions): Promise<Transaction>;
    /**
     * @description Alias for startTransaction {Promise<Transaction>} trx
     */
    beginTransaction(driverSpecificOptions?: DriverSpecificOptions): Promise<Transaction>;
    /**
     * @description Alias for startTransaction {Promise<Transaction>} trx
     */
    transaction(driverSpecificOptions?: DriverSpecificOptions): Promise<Transaction>;
    /**
     * @description Returns model manager for the provided model
     */
    getModelManager<T extends Model>(model: {
        new (): T;
    } | typeof Model): ModelManager<T>;
    /**
     * @description Executes a callback function with the provided connection details
     */
    static useConnection(connectionDetails: SqlDataSourceInput, cb: (sqlDataSource: SqlDataSource) => Promise<void>): Promise<void>;
    /**
     * @description Returns the current connection {Promise<SqlConnectionType>} sqlConnection
     */
    getCurrentConnection(): SqlConnectionType;
    /**
     * @description Returns separate raw sql connection
     */
    getRawConnection(driverSpecificOptions?: DriverSpecificOptions): Promise<SqlConnectionType>;
    /**
     * @description Closes the connection to the database
     */
    closeConnection(): Promise<void>;
    /**
     * @description Closes the main connection to the database established with SqlDataSource.connect() method
     */
    static closeConnection(): Promise<void>;
    /**
     * @description Disconnects the connection to the database
     * @alias closeConnection
     */
    disconnect(): Promise<void>;
    /**
     * @description Disconnects the main connection to the database established with SqlDataSource.connect() method
     * @alias closeMainConnection
     */
    static disconnect(): Promise<void>;
    /**
     * @description Executes a raw query on the database
     */
    rawQuery(query: string, params?: any[]): Promise<any>;
    /**
     * @description Executes a raw query on the database with the base connection created with SqlDataSource.connect() method
     */
    static rawQuery(query: string, params?: any[]): Promise<any>;
    private connectDriver;
}

declare class ColumnOptionsBuilder {
    protected table: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected columnName: string;
    protected columnReferences: {
        table: string;
        column: string;
        onDelete?: string;
        onUpdate?: string;
    }[];
    protected sqlType: SqlDataSourceType;
    constructor(table: string, queryStatements: string[], partialQuery: string, sqlType: SqlDataSourceType, columnName?: string, columnReferences?: {
        table: string;
        column: string;
        onDelete?: string;
        onUpdate?: string;
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
    references(table: string, column: string, options?: {
        onDelete: string;
        onUpdate: string;
    }): ColumnOptionsBuilder;
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
    protected table: string;
    protected queryStatements: string[];
    protected columnName: string;
    protected sqlType: SqlDataSourceType;
    partialQuery: string;
    constructor(table: string, queryStatements: string[], partialQuery: string, sqlType: SqlDataSourceType);
    string(name: string, length?: number): ColumnOptionsBuilder;
    varchar(name: string, length?: number): ColumnOptionsBuilder;
    uuid(name: string): ColumnOptionsBuilder;
    tinytext(name: string): ColumnOptionsBuilder;
    mediumtext(name: string): ColumnOptionsBuilder;
    longtext(name: string): ColumnOptionsBuilder;
    binary(name: string, length?: number): ColumnOptionsBuilder;
    enum(name: string, values: string[]): ColumnOptionsBuilder;
    text(name: string): ColumnOptionsBuilder;
    char(name: string, length?: number): ColumnOptionsBuilder;
    tinyint(name: string): ColumnOptionsBuilder;
    smallint(name: string): ColumnOptionsBuilder;
    mediumint(name: string): ColumnOptionsBuilder;
    /**
     * @description If using mysql, it will automatically add INT AUTO_INCREMENT
     * @param name
     */
    serial(name: string): ColumnOptionsBuilder;
    /**
     * @description If using mysql, it will automatically be converted in BIGINT AUTO_INCREMENT
     * @description If using sqlite, it will automatically be converted in INTEGER PRIMARY KEY AUTOINCREMENT
     * @param name
     */
    bigSerial(name: string): ColumnOptionsBuilder;
    integer(name: string, length?: number): ColumnOptionsBuilder;
    bigInteger(name: string): ColumnOptionsBuilder;
    /**
     * @description Alias for integer
     * @param name
     * @returns ColumnOptionsBuilder
     */
    int(name: string): ColumnOptionsBuilder;
    /**
     * @description Alias for bigInteger
     * @param name
     * @returns ColumnOptionsBuilder
     */
    bigint(name: string): ColumnOptionsBuilder;
    float(name: string, options?: {
        precision: number;
        scale: number;
    }): ColumnOptionsBuilder;
    decimal(name: string, options?: {
        precision: number;
        scale: number;
    }): ColumnOptionsBuilder;
    double(name: string, options?: {
        precision: number;
        scale: number;
    }): ColumnOptionsBuilder;
    boolean(name: string): ColumnOptionsBuilder;
    date(name: string, options?: DateOptions): ColumnOptionsBuilder;
    timestamp(name: string, options?: DateOptions): ColumnOptionsBuilder;
    /**
     * @description EXPERIMENTAL
     * @param name
     */
    jsonb(name: string): ColumnOptionsBuilder;
}

type References = {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
};
type AlterOptions = {
    afterColumn?: string;
    references?: References;
};
type DataType = "uuid" | "varchar" | "tinytext" | "mediumtext" | "longtext" | "binary" | "text" | "char" | "tinyint" | "smallint" | "mediumint" | "integer" | "bigint" | "float" | "decimal" | "double" | "boolean" | "jsonb";
type BaseOptions = {
    afterColumn?: string;
    references?: References;
    precision?: number;
    scale?: number;
    default?: any;
    primaryKey?: boolean;
    unique?: boolean;
    notNullable?: boolean;
    autoIncrement?: boolean;
    length?: number;
};
declare class ColumnBuilderAlter {
    protected table: string;
    protected queryStatements: string[];
    protected sqlType: SqlDataSourceType;
    protected partialQuery: string;
    constructor(table: string, queryStatements: string[], partialQuery: string, sqlType: SqlDataSourceType);
    /**
     * @description Add a new column to the table
     * @param columnName { string }
     * @param {DataType} dataType
     * @param {BaseOptions} options
     */
    addColumn(columnName: string, dataType: DataType, options?: BaseOptions): ColumnBuilderAlter;
    /**
     * @description Add a new date column to the table
     * @param columnName { string }
     * @param options { DateOptions }
     */
    addDateColumn(columnName: string, type: "date" | "timestamp", options?: DateOptions & {
        afterColumn?: string;
        notNullable?: boolean;
        default?: string | Date | DateTime;
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
        default?: string;
        unique?: boolean;
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
    modifyColumnType(columnName: string, newDataType: string, options?: BaseOptions): ColumnBuilderAlter;
    /**
     * @description Renames a table
     * @param oldtable
     * @param newtable
     */
    renameTable(oldtable: string, newtable: string): ColumnBuilderAlter;
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

declare class ColumnBuilderConnector {
    protected table: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected sqlType: SqlDataSourceType;
    constructor(table: string, queryStatements: string[], partialQuery: string, sqlType: SqlDataSourceType);
    newColumn(): ColumnTypeBuilder;
}

declare class Schema {
    queryStatements: string[];
    sqlType: SqlDataSourceType;
    constructor(sqlType?: SqlDataSourceType);
    /**
     * @description Add raw query to the migration
     * @param query
     */
    rawQuery(query: string): void;
    createTable(table: string, options?: {
        ifNotExists?: boolean;
    }): ColumnBuilderConnector;
    /**
     * @description Alter table
     * @param table
     * @returns ColumnBuilderAlter
     */
    alterTable(table: string): ColumnBuilderAlter;
    /**
     * @description Drop table
     * @param table
     * @param ifExists
     * @returns void
     */
    dropTable(table: string, ifExists?: boolean): void;
    /**
     * @description Rename table
     * @param oldtable
     * @param newtable
     * @returns void
     */
    renameTable(oldtable: string, newtable: string): void;
    /**
     * @description Truncate table
     * @param table
     * @returns void
     */
    truncateTable(table: string): void;
    /**
     * @description Create index on table
     * @param table
     * @param indexName
     * @param columns
     * @param unique
     * @returns void
     */
    createIndex(table: string, indexName: string, columns: string[], unique?: boolean): void;
    /**
     * @description Drop index on table
     * @param table
     * @param indexName
     * @returns void
     */
    dropIndex(table: string, indexName: string): void;
    /**
     * @description Adds a primary key to a table
     * @param table
     * @param columnName
     * @param type
     * @param options
     * @returns void
     */
    addPrimaryKey(table: string, columns: string[]): void;
    /**
     * @description Drops a primary key from a table
     * @param table
     * @returns void
     */
    dropPrimaryKey(table: string): void;
    /**
     * @description Adds a foreign key to a table
     * @param table
     * @param constraintName
     * @param columns
     * @returns void
     */
    addConstraint(table: string, constraintName: string, columns: string[]): void;
    /**
     * @description Drops a cosntraint from a table
     * @param table
     * @param constraintName
     * @returns void
     */
    dropConstraint(table: string, constraintName: string): void;
    /**
     * @description Adds a unique constraint to a table
     * @param table
     * @param constraintName
     * @param columns
     * @returns void
     */
    addUniqueConstraint(table: string, constraintName: string, columns: string[]): void;
    /**
     * @description Drops a unique constraint from a table
     * @param table
     * @param constraintName
     * @returns void
     */
    dropUniqueConstraint(table: string, constraintName: string): void;
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
    afterUp?(sql: SqlDataSource): Promise<void>;
    /**
     * @description This method is called after the migration has been rolled back
     */
    afterDown?(sql: SqlDataSource): Promise<void>;
}

/**
 * columns
 */
interface ColumnOptions {
    booleanColumn?: boolean;
    primaryKey?: boolean;
}
/**
 * @description Decorator to define a column in the model
 * @param options - Options for the column
 * @returns
 */
declare function column(options?: ColumnOptions): PropertyDecorator;
/**
 * @description Defines a dynamic calculated column that is not defined inside the Table, it must be added to a query in order to be retrieved
 * @param columnName that will be filled inside the dynamicColumn field
 * @returns
 */
declare function dynamicColumn(columnName: string): PropertyDecorator;
/**
 * @description Returns the columns of the model, columns must be decorated with the column decorator
 * @param target Model
 * @returns
 */
declare function getModelColumns(target: typeof Model): string[];
/**
 * relations
 */
/**
 * @description Establishes a belongs to relation with the given model
 * @param model - callback that returns the related model
 * @param foreignKey - the foreign key in the current model that defines the relation
 * @param options - Options for the relation
 * @returns
 */
declare function belongsTo(model: () => typeof Model, foreignKey: string, options?: RelationOptions): PropertyDecorator;
/**
 * @description Establishes a has one relation with the given model
 * @param model - callback that returns the related model
 * @param foreignKey - the foreign key in the relation model that defines the relation
 * @param options - Options for the relation
 * @returns
 */
declare function hasOne(model: () => typeof Model, foreignKey: string, options?: RelationOptions): PropertyDecorator;
/**
 * @description Establishes a has many relation with the given model
 * @param model - callback that returns the related model
 * @param foreignKey - the foreign key in the relation model that defines the relation
 * @param options - Options for the relation
 * @returns
 */
declare function hasMany(model: () => typeof Model, foreignKey: string, options?: RelationOptions): PropertyDecorator;
/**
 * @description Returns the relations of the model
 * @param target Model
 * @returns
 */
declare function getRelations(target: typeof Model): Relation[];
/**
 * @description Returns the primary key of the model
 * @param target Model
 * @returns
 */
declare function getPrimaryKey(target: typeof Model): string;

/**
 * @description The Redis_data_source class is a wrapper around the ioredis library that provides a simple interface to interact with a redis database
 */
type RedisStorable = string | number | boolean | Buffer | Array<any> | Record<string, any>;
/**
 * @description The RedisGiveable type is a type that can be stored in the redis database
 */
type RedisGiveable = string | number | boolean | Record<string, any> | Array<any> | null;
declare class RedisDataSource {
    static isConnected: boolean;
    protected static redisConnection: Redis;
    isConnected: boolean;
    protected redisConnection: Redis;
    constructor(input?: RedisOptions);
    /**
     * @description Connects to the redis database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
     * @description The User input connection details will always come first
     * @description This is intended as a singleton connection to the redis database, if you need multiple connections, use the getConnection method
     * @param {RedisDataSourceInput} input - Details for the redis connection
     */
    static connect(input?: RedisOptions): Promise<void>;
    /**
     * @description Establishes a connection to the redis database and returns the connection
     * @param input
     * @returns
     */
    static getConnection(input?: RedisOptions): Promise<RedisDataSource>;
    /**
     * @description Sets a key-value pair in the redis database
     * @param {string} key - The key
     * @param {string} value - The value
     * @param {number} expirationTime - The expiration time in milliseconds
     * @returns {Promise<void>}
     */
    static set(key: string, value: RedisStorable, expirationTime?: number): Promise<void>;
    /**
     * @description Gets the value of a key in the redis database
     * @param {string} key - The key
     * @returns {Promise<string>}
     */
    static get<T = RedisGiveable>(key: string): Promise<T | null>;
    /**
     * @description Gets the value of a key in the redis database as a buffer
     */
    static getBuffer(key: string): Promise<Buffer | null>;
    /**
     * @description Gets the value of a key in the redis database and deletes the key
     * @param {string} key - The key
     * @returns {Promise
     * <T | null>}
     */
    static getAndDelete<T = RedisGiveable>(key: string): Promise<T | null>;
    /**
     * @description Deletes a key from the redis database
     * @param {string} key - The key
     * @returns {Promise<void>}
     */
    static delete(key: string): Promise<void>;
    /**
     * @description Flushes all the data in the redis database
     * @returns {Promise<void>}
     */
    static flushAll(): Promise<void>;
    /**
     * @description Returns the raw redis connection that uses the ioredis library
     * @returns {Redis}
     */
    static getRawConnection(): Redis;
    /**
     * @description Disconnects from the redis database
     * @returns {Promise<void>}
     */
    static disconnect(): Promise<void>;
    /**
     * @description Sets a key-value pair in the redis database
     * @param {string} key - The key
     * @param {string} value - The value
     * @param {number} expirationTime - The expiration time in milliseconds
     * @returns {Promise<void>}
     */
    set(key: string, value: RedisStorable, expirationTime?: number): Promise<void>;
    /**
     * @description Gets the value of a key in the redis database
     * @param {string} key - The key
     * @returns {Promise<string>}
     */
    get<T = RedisGiveable>(key: string): Promise<T | null>;
    /**
     * @description Gets the value of a key in the redis database as a buffer
     */
    getBuffer(key: string): Promise<Buffer | null>;
    /**
     * @description Gets the value of a key in the redis database and deletes the key
     * @param {string} key - The key
     * @returns {Promise
     * <T | null>}
     */
    getAndDelete<T = RedisGiveable>(key: string): Promise<T | null>;
    /**
     * @description Deletes a key from the redis database
     * @param {string} key - The key
     * @returns {Promise<void>}
     */
    delete(key: string): Promise<void>;
    /**
     * @description Flushes all the data in the redis database
     * @returns {Promise<void>}
     */
    flushAll(): Promise<void>;
    /**
     * @description Returns the raw redis connection that uses the ioredis library
     * @returns {Redis}
     */
    getRawConnection(): Redis;
    /**
     * @description Disconnects from the redis database
     * @returns {Promise<void>}
     */
    disconnect(): Promise<void>;
    protected static getValue<T = RedisGiveable>(value: string | null): T | null;
}

type BaseModelMethodOptions = {
    useConnection?: MongoDataSource;
    session?: mongodb.ClientSession;
};
/**
 * @descriptionAllows Allows a type safe way to make a Partial of T, while keeping the keys that are not in T for unstructured data
 */
type ModelKeyOrAny<T> = {
    [key in keyof T]?: T[key];
} & {
    [key: string]: any;
};
/**
 * @description Allows a type-safe way to make a Partial of T, while keeping the keys that are not in T for unstructured data, with values restricted to 1 or -1
 */
type ModelKeyOrAnySort<T> = {
    [key in keyof T]?: 1 | -1;
} & {
    [key: string]: 1 | -1;
};

type FetchHooks = "beforeFetch" | "afterFetch";
type BinaryOperatorType = "$eq" | "$ne" | "$gt" | "$gte" | "$lt" | "$lte";
type BaseValues = string | number | boolean | Date | Array<string | number | boolean | Date>;
type OneOptions = {
    throwErrorOnNull?: boolean;
    ignoreHooks?: FetchHooks[];
};
type ManyOptions = {
    ignoreHooks?: FetchHooks[];
};
declare class MongoQueryBuilder<T extends Collection> {
    protected dynamicPropertys: string[];
    protected idObject: mongodb.Filter<mongodb.BSON.Document>;
    protected selectObject?: Record<string, 1>;
    protected selectFields?: string[];
    protected whereObject: mongodb.Filter<mongodb.BSON.Document>;
    protected sortObject?: mongodb.Sort;
    protected limitNumber?: number;
    protected offsetNumber?: number;
    protected mongoDataSource: MongoDataSource;
    protected collection: mongodb.Collection;
    protected model: typeof Collection;
    protected logs: boolean;
    protected session?: mongodb.ClientSession;
    constructor(model: typeof Collection, mongoDataSource: MongoDataSource, session?: mongodb.ClientSession, logs?: boolean);
    one(options?: OneOptions): Promise<T | null>;
    oneOrFail(options?: OneOptions): Promise<T>;
    many(options?: ManyOptions): Promise<T[]>;
    /**
     * @Massive Updates all the documents that match the query
     * @param modelData
     * @returns
     */
    update(modelData: ModelKeyOrAny<T>, options?: {
        ignoreHooks?: boolean;
    }): Promise<T[]>;
    /**
     * @Massive Deletes all the documents that match the query
     * @returns
     */
    delete(options?: {
        ignoreHooks?: boolean;
    }): Promise<void>;
    /**
     * @description Fetches the count of the query
     * @returns - The count of the query
     */
    count(options?: {
        ignoreHooks?: boolean;
    }): Promise<number>;
    addDynamicProperty(dynamicPropertys: DynamicColumnType<T>[]): this;
    /**
     * @description Only fetches the provided fields
     * @param fields - Fields to select
     */
    select(fields: SelectableType<T>[]): this;
    select(fields: string[]): this;
    /**
     * @description Adds a where clause to the query
     */
    where(property: SelectableType<T>, operator: BinaryOperatorType, value: BaseValues): this;
    where(property: string, operator: BinaryOperatorType, value: BaseValues): this;
    where(property: SelectableType<T> | string, value: BaseValues): this;
    /**
     * @description Adds a where clause to the query - alias for where
     */
    andWhere(property: SelectableType<T>, operator: BinaryOperatorType, value: BaseValues): this;
    andWhere(property: string, operator: BinaryOperatorType, value: BaseValues): this;
    andWhere(property: SelectableType<T> | string, value: BaseValues): this;
    /**
     * @description Adds an or where clause to the query
     */
    orWhere(property: SelectableType<T>, operator: BinaryOperatorType, value: BaseValues): this;
    orWhere(property: string, operator: BinaryOperatorType, value: BaseValues): this;
    orWhere(property: SelectableType<T> | string, value: BaseValues): this;
    /**
     * @description Adds a where exists clause to the query
     */
    whereExists(property: SelectableType<T>): this;
    whereExists(property: string): this;
    /**
     * @description Adds an and where exists clause to the query
     */
    andWhereExists(property: SelectableType<T>): this;
    andWhereExists(property: string): this;
    /**
     * @description Adds an or where exists clause to the query
     */
    orWhereExists(property: SelectableType<T>): this;
    orWhereExists(property: string): this;
    /**
     * @description Adds a where not exists clause to the query
     */
    whereNotExists(property: SelectableType<T>): this;
    whereNotExists(property: string): this;
    /**
     * @description Adds an and where not exists clause to the query
     */
    andWhereNotExists(property: SelectableType<T>): this;
    andWhereNotExists(property: string): this;
    /**
     * @description Adds an or where not exists clause to the query
     */
    orWhereNotExists(property: SelectableType<T>): this;
    orWhereNotExists(property: string): this;
    /**
     * @description Adds a where not clause to the query
     */
    whereNot(property: SelectableType<T>, value: BaseValues): this;
    whereNot(property: string, value: BaseValues): this;
    /**
     * @description Adds an and where not clause to the query
     */
    andWhereNot(property: SelectableType<T>, value: BaseValues): this;
    andWhereNot(property: string, value: BaseValues): this;
    /**
     * @description Adds an or where not clause to the query
     */
    orWhereNot(property: SelectableType<T>, value: BaseValues): this;
    orWhereNot(property: string, value: BaseValues): this;
    /**
     * @description Adds a where like clause to the query
     */
    whereLike(property: SelectableType<T>, value: string): this;
    whereLike(property: string, value: string): this;
    /**
     * @description Adds an and where like clause to the query
     */
    andWhereLike(property: SelectableType<T>, value: string): this;
    andWhereLike(property: string, value: string): this;
    /**
     * @description Adds an or where like clause to the query
     */
    orWhereLike(property: SelectableType<T>, value: string): this;
    orWhereLike(property: string, value: string): this;
    /**
     * @description Adds a where not like clause to the query
     */
    whereNotLike(property: SelectableType<T>, value: string): this;
    whereNotLike(property: string, value: string): this;
    /**
     * @description Adds an and where not like clause to the query
     */
    andWhereNotLike(property: SelectableType<T>, value: string): this;
    andWhereNotLike(property: string, value: string): this;
    /**
     * @description Adds an or where not like clause to the query
     */
    orWhereNotLike(property: SelectableType<T>, value: string): this;
    orWhereNotLike(property: string, value: string): this;
    /**
     * @description Adds a where in clause to the query
     */
    whereIn(property: SelectableType<T>, values: BaseValues[]): this;
    whereIn(property: string, values: BaseValues[]): this;
    /**
     * @description Adds an and where in clause to the query
     */
    andWhereIn(property: SelectableType<T>, values: BaseValues[]): this;
    andWhereIn(property: string, values: BaseValues[]): this;
    /**
     * @description Adds an or where in clause to the query
     */
    orWhereIn(property: SelectableType<T>, values: BaseValues[]): this;
    orWhereIn(property: string, values: BaseValues[]): this;
    /**
     * @description Adds a where not in clause to the query
     */
    whereNotIn(property: SelectableType<T>, values: BaseValues[]): this;
    whereNotIn(property: string, values: BaseValues[]): this;
    /**
     * @description Adds an and where not in clause to the query
     */
    andWhereNotIn(property: SelectableType<T>, values: BaseValues[]): this;
    andWhereNotIn(property: string, values: BaseValues[]): this;
    /**
     * @description Adds an or where not in clause to the query
     */
    orWhereNotIn(property: SelectableType<T>, values: BaseValues[]): this;
    orWhereNotIn(property: string, values: BaseValues[]): this;
    /**
     * @description Adds a where null clause to the query
     */
    whereNull(property: SelectableType<T>): this;
    whereNull(property: string): this;
    /**
     * @description Adds an and where null clause to the query
     */
    andWhereNull(property: SelectableType<T>): this;
    andWhereNull(property: string): this;
    /**
     * @description Adds an or where null clause to the query
     */
    orWhereNull(property: SelectableType<T>): this;
    orWhereNull(property: string): this;
    /**
     * @description Adds a where not null clause to the query
     */
    whereNotNull(property: SelectableType<T>): this;
    whereNotNull(property: string): this;
    /**
     * @description Adds an and where not null clause to the query
     */
    andWhereNotNull(property: SelectableType<T>): this;
    andWhereNotNull(property: string): this;
    /**
     * @description Adds an or where not null clause to the query
     */
    orWhereNotNull(property: SelectableType<T>): this;
    orWhereNotNull(property: string): this;
    /**
     * @description Adds a where between clause to the query
     */
    whereBetween(property: SelectableType<T>, values: [BaseValues, BaseValues]): this;
    whereBetween(property: string, values: [BaseValues, BaseValues]): this;
    /**
     * @description Adds an and where between clause to the query
     */
    andWhereBetween(property: SelectableType<T>, values: [BaseValues, BaseValues]): this;
    andWhereBetween(property: string, values: [BaseValues, BaseValues]): this;
    /**
     * @description Adds an or where between clause to the query
     */
    orWhereBetween(property: SelectableType<T>, values: [BaseValues, BaseValues]): this;
    orWhereBetween(property: string, values: [BaseValues, BaseValues]): this;
    /**
     * @description Adds a where not between clause to the query
     */
    whereNotBetween(property: SelectableType<T>, values: [BaseValues, BaseValues]): this;
    whereNotBetween(property: string, values: [BaseValues, BaseValues]): this;
    /**
     * @description Adds an and where not between clause to the query
     */
    andWhereNotBetween(property: SelectableType<T>, values: [BaseValues, BaseValues]): this;
    andWhereNotBetween(property: string, values: [BaseValues, BaseValues]): this;
    /**
     * @description Adds an or where not between clause to the query
     */
    orWhereNotBetween(property: SelectableType<T>, values: [BaseValues, BaseValues]): this;
    orWhereNotBetween(property: string, values: [BaseValues, BaseValues]): this;
    /**
     * @description Gives the possibility to add a raw where clause using the mongodb.Filter type
     */
    rawWhere(whereObject: mongodb.Filter<mongodb.BSON.Document>): this;
    /**
     * @description Gives the possibility to add a raw where clause using the mongodb.Filter type
     */
    andRawWhere(whereObject: mongodb.Filter<mongodb.BSON.Document>): this;
    /**
     * @description Gives the possibility to add a raw where clause using the mongodb.Filter type
     */
    orRawWhere(whereObject: mongodb.Filter<mongodb.BSON.Document>): this;
    /**
     * @description Adds a sort to the query for the id
     * @param sortBy - The sort criteria, which can be a number, string, object, or array of these types
     * @returns
     */
    sortById(sortBy: 1 | -1): this;
    /**
     * @description Adds a sort to the query, do not use this method if you want to sort by id use the sortById method
     * @param sortBy - The sort criteria, which can be a number, string, object, or array of these types
     * @returns The current instance for chaining
     */
    sort(sortBy: 1 | -1): this;
    sort(sortBy: SelectableType<T>): this;
    sort(sortBy: SelectableType<T>[]): this;
    sort(sortBy: string): this;
    sort(sortBy: string[]): this;
    sort(sortBy: ModelKeyOrAnySort<T>): this;
    /**
     * @description Adds a limit to the query
     * @param limit - The limit to set
     * @returns
     */
    limit(limit: number): this;
    /**
     * @description Adds an offset to the query
     * @param offset - The offset to set
     * @returns
     */
    offset(offset: number): this;
}

declare class Collection extends Entity {
    /**
     * @description The sql sqlInstance generated by SqlDataSource.connect
     */
    static mongoInstance: MongoDataSource;
    /**
     * @description Collection name for the model, if not set it will be the plural snake case of the model name given that is in PascalCase (es. User -> users)
     */
    static collectionName: string;
    /**
     * @description Static getter for collection;
     * @internal
     */
    static get collection(): string;
    /**
     * @description The id of the record, this will be used to interact with the _id field in the database, every model has an id by default
     */
    id: string;
    /**
     * @description Gets the main query builder for the model
     * @param options - The options to get the model manager
     * @returns {MongoQueryBuilder<T>}
     */
    static query<T extends Collection>(this: new () => T | typeof Collection, options?: BaseModelMethodOptions): MongoQueryBuilder<T>;
    /**
     * @description Finds records in the collection, to use for simple queries
     * @param this
     * @param options
     */
    static find<T extends Collection>(this: new () => T | typeof Collection, options?: MongoFindManyOptions<T> & BaseModelMethodOptions): Promise<T[]>;
    static find<T extends Collection>(this: new () => T | typeof Collection, options?: MongoUnrestrictedFindManyOptions<T> & BaseModelMethodOptions): Promise<T[]>;
    /**
     * @description Finds a record in the collection, to use for simple queries
     * @param this
     * @param options
     */
    static findOne<T extends Collection>(this: new () => T | typeof Collection, options: MongoFindOneOptions<T> & BaseModelMethodOptions): Promise<T | null>;
    static findOne<T extends Collection>(this: new () => T | typeof Collection, options: UnrestrictedMongoFindOneOptions<T> & BaseModelMethodOptions): Promise<T | null>;
    /**
     * @description Finds a record in the collection, to use for simple queries
     * @param this
     * @param options
     * @throws {Error} - If the record could not be found
     * @returns {Promise<T>}
     */
    static findOneOrFail<T extends Collection>(this: new () => T | typeof Collection, options: MongoFindOneOptions<T> & BaseModelMethodOptions): Promise<T>;
    static findOneOrFail<T extends Collection>(this: new () => T | typeof Collection, options: UnrestrictedMongoFindOneOptions<T> & BaseModelMethodOptions): Promise<T>;
    /**
     * @description Saves a new record to the collection
     * @param model
     * @param {Model} modelData - The data to be saved
     * @param {BaseModelMethodOptions} options - The options to get the model manager
     * @returns {Promise<T>}
     */
    static insert<T extends Collection>(this: new () => T | typeof Collection, modelData: ModelKeyOrAny<T>, options?: BaseModelMethodOptions): Promise<T>;
    /**
     * @description Saves multiple records to the collection
     * @param {Model} modelData - The data to be fetched
     * @param {BaseModelMethodOptions} options - The options to get the model manager
     * @returns {Promise<T>}
     */
    static insertMany<T extends Collection>(this: new () => T | typeof Collection, modelData: ModelKeyOrAny<T>[], options?: BaseModelMethodOptions): Promise<T[]>;
    /**
     * @description Updates a record in the collection using it's id
     * @param {Model} modelData - The data to be updated
     * @param {BaseModelMethodOptions} options - The options to get the model manager
     * @returns {Promise<T>} - The updated record refreshed from the database
     */
    static updateRecord<T extends Collection>(this: new () => T | typeof Collection, model: T, options?: BaseModelMethodOptions): Promise<T>;
    /**
     * @description Deletes a record in the collection using it's id
     * @param {BaseModelMethodOptions} options - The options to get the model manager
     * @returns {Promise<void>}
     * @throws {Error} - If the record could not be deleted
     */
    static deleteRecord<T extends Collection>(this: new () => T | typeof Collection, model: T, options?: BaseModelMethodOptions): Promise<void>;
    /**
     * @description Gets the main connection from the mongoInstance
     */
    private static establishConnection;
    /**
     * @description Gives the correct model manager with the correct connection based on the options provided
     * @param this
     * @param options - The options to get the model manager
     * @returns
     */
    private static dispatchModelManager;
    /**
     * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
     * @param queryBuilder
     */
    static beforeFetch(queryBuilder: MongoQueryBuilder<any>): void;
    /**
     * @description Adds a beforeInsert clause to the model, adding the ability to modify the data after fetching the data
     * @param data
     * @returns {T}
     */
    static beforeInsert(data: any): void;
    /**
     * @description Adds a beforeUpdate clause to the model, adding the ability to modify the query before updating the data
     * @param data
     */
    static beforeUpdate(queryBuilder: MongoQueryBuilder<any>): void;
    /**
     * @description Adds a beforeDelete clause to the model, adding the ability to modify the query before deleting the data
     * @param data
     */
    static beforeDelete(queryBuilder: MongoQueryBuilder<any>): void;
    /**
     * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
     * @param data
     * @returns {T}
     */
    static afterFetch(data: any[]): Promise<Collection[]>;
}

type MongoFindOneOptions<T extends Collection> = {
    ignoreHooks?: FetchHooks[];
    select?: SelectableType<T>[];
    where?: ModelKeyOrAny<T>;
};
type UnrestrictedMongoFindOneOptions<T extends Collection> = {
    ignoreHooks?: FetchHooks[];
    select?: string[];
    where?: ModelKeyOrAny<T>;
};
type MongoFindManyOptions<T extends Collection> = MongoFindOneOptions<T> & {
    sort?: ModelKeyOrAnySort<T>;
    limit?: number;
    offset?: number;
};
type MongoUnrestrictedFindManyOptions<T extends Collection> = UnrestrictedMongoFindOneOptions<T> & {
    sort?: Record<string, 1 | -1>;
    limit?: number;
    offset?: number;
};
declare class CollectionManager<T extends Collection> {
    protected logs: boolean;
    protected collection: typeof Collection;
    protected mongoClient: mongodb.MongoClient;
    protected mongoDataSource: MongoDataSource;
    protected collectionInstance: mongodb.Collection;
    protected session?: mongodb.ClientSession;
    constructor(_collection: typeof Collection, mongoDataSource: MongoDataSource, session?: mongodb.ClientSession, logs?: boolean);
    /**
     * @description Finds all records that match the input
     */
    find(options?: MongoUnrestrictedFindManyOptions<T> | MongoFindManyOptions<T>): Promise<T[]>;
    /**
     * @description Finds the first record that matches the input
     */
    findOne(options: UnrestrictedMongoFindOneOptions<T> | MongoFindOneOptions<T>): Promise<T | null>;
    /**
     * @description Finds the first record that matches the input or throws an error
     */
    findOneOrFail(options: (UnrestrictedMongoFindOneOptions<T> | MongoFindOneOptions<T>) & {
        customError?: Error;
    }): Promise<T>;
    /**
     * @description Starts a query builder chain
     */
    query<T extends Collection>(): MongoQueryBuilder<T>;
    /**
     * @description Finds a record by its primary key
     */
    insert(modelData: ModelKeyOrAny<T>, options?: {
        ignoreHooks?: boolean;
    }): Promise<T>;
    /**
     * @description Creates multiple records
     */
    insertMany(modelData: ModelKeyOrAny<T>[], options?: {
        ignoreHooks?: boolean;
    }): Promise<T[]>;
    /**
     * @description Updates a record
     */
    updateRecord(modelData: T): Promise<T>;
    /**
     * @description Deletes a record
     */
    deleteRecord(model: T): Promise<T>;
}

type MongoDataSourceInput = Exclude<DataSourceInput, "pgOptions" | "mysqlOptions">;
declare class MongoDataSource extends DataSource {
    url: string;
    isConnected: boolean;
    private mongoClient;
    private static instance;
    private constructor();
    /**
     * @description Returns the current connection to the mongo client to execute direct statements using the mongo client from `mongodb` package
     * @returns {mongodb.MongoClient} - returns the current connection to the mongo database
     */
    getCurrentConnection(): mongodb.MongoClient;
    /**
     * @description Connects to the mongo database using the provided url and options
     * @returns
     */
    static connect(url?: string, options?: MongoDataSourceInput["mongoOptions"] & {
        logs?: boolean;
    }, cb?: () => void): Promise<MongoDataSource>;
    static getInstance(): MongoDataSource;
    /**
     * @description Starts a new session and transaction using the current connection
     * @returns {mongodb.ClientSession}
     */
    startSession(): mongodb.ClientSession;
    /**
     * @description Disconnects from the mongo database using the current connection established by the `connect` method
     */
    static disconnect(): Promise<void>;
    /**
     * @description Disconnects from the mongo database
     */
    disconnect(): Promise<void>;
    /**
     * @description Closes the current connection to the mongo database
     * @alias disconnect
     */
    closeConnection(): Promise<void>;
    /**
     * @description Executes a callback function with the provided connection details
     * @alias disconnect
     */
    static closeConnection(): Promise<void>;
    /**
     * @description Executes a callback function with the provided connection details
     */
    static useConnection<T extends Collection>(this: typeof MongoDataSource, connectionDetails: {
        url: string;
        options?: MongoDataSourceInput["mongoOptions"];
    }, cb: (mongoDataSource: MongoDataSource) => Promise<void>): Promise<void>;
    getModelManager<T extends Collection>(model: typeof Collection, mongoDataSource: MongoDataSource, session?: mongodb.ClientSession): CollectionManager<T>;
}

declare class StandaloneQueryBuilder {
    protected selectQuery: string;
    protected joinQuery: string;
    protected relations: string[];
    protected dynamicColumns: string[];
    protected groupByQuery: string;
    protected orderByQuery: string;
    protected limitQuery: string;
    protected offsetQuery: string;
    protected whereQuery: string;
    protected havingQuery: string;
    protected dbType: SqlDataSourceType;
    protected params: any[];
    protected model: typeof Model;
    protected whereTemplate: ReturnType<typeof whereTemplate>;
    protected isNestedCondition: boolean;
    protected selectTemplate: ReturnType<typeof selectTemplate>;
    /**
     * @description Constructs a Mysql_query_builder instance.
     */
    constructor(dbType: SqlDataSourceType, table: string, modelCaseConvention?: CaseConvention, databaseCaseConvention?: CaseConvention, isNestedCondition?: boolean);
    select(...columns: string[]): StandaloneQueryBuilder;
    /**
     * @description Selects all columns from the table.
     */
    joinRaw(query: string): StandaloneQueryBuilder;
    /**
     * @description Adds a JOIN condition to the query.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): StandaloneQueryBuilder;
    /**
     * @description Adds a LEFT JOIN condition to the query.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): StandaloneQueryBuilder;
    /**
     * @description Given a callback, it will execute the callback with a query builder instance.
     */
    whereBuilder(cb: (queryBuilder: StandaloneQueryBuilder) => void): this;
    /**
     * @description Given a callback, it will execute the callback with a query builder instance.
     */
    orWhereBuilder(cb: (queryBuilder: StandaloneQueryBuilder) => void): this;
    /**
     * @description Given a callback, it will execute the callback with a query builder instance.
     */
    andWhereBuilder(cb: (queryBuilder: StandaloneQueryBuilder) => void): this;
    /**
     * @description Accepts a value and executes a callback only of the value is not null or undefined.
     */
    when(value: any, cb: (value: any, query: StandaloneQueryBuilder) => void): this;
    /**
     * @description Adds a WHERE condition to the query.
     * @returns The query_builder instance for chaining.
     */
    where(column: string, operatorOrValue: BinaryOperatorType$1 | BaseValues$1, value?: BaseValues$1): this;
    /**
     * @description Adds an AND WHERE condition to the query.
     * @returns The query_builder instance for chaining.
     */
    andWhere(column: string, operatorOrValue: BinaryOperatorType$1 | BaseValues$1, value?: BaseValues$1): this;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @returns The query_builder instance for chaining.
     */
    orWhere(column: string, operatorOrValue: BinaryOperatorType$1 | BaseValues$1, value?: BaseValues$1): this;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    whereBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    andWhereBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    orWhereBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    whereNotBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    orWhereNotBetween(column: string, min: BaseValues$1, max: BaseValues$1): this;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    whereIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    andWhereIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    orWhereIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    whereNotIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @returns The query_builder instance for chaining.
     */
    orWhereNotIn(column: string, values: BaseValues$1[]): this;
    /**
     * @description Adds a WHERE NULL condition to the query.
     * @returns The query_builder instance for chaining.
     */
    whereNull(column: string): this;
    /**
     * @description Adds an AND WHERE NULL condition to the query.
     * @returns The query_builder instance for chaining.
     */
    andWhereNull(column: string): this;
    /**
     * @description Adds an OR WHERE NULL condition to the query.
     * @returns The query_builder instance for chaining.
     */
    orWhereNull(column: string): this;
    /**
     * @description Adds a WHERE NOT NULL condition to the query.
     * @returns The query_builder instance for chaining.
     */
    whereNotNull(column: string): this;
    /**
     * @description Adds an AND WHERE NOT NULL condition to the query.
     * @returns The query_builder instance for chaining.
     */
    andWhereNotNull(column: string): this;
    /**
     * @description Adds an OR WHERE NOT NULL condition to the query.
     * @returns The query_builder instance for chaining.
     */
    orWhereNotNull(column: string): this;
    /**
     * @description Adds a raw WHERE condition to the query.
     * @returns The query_builder instance for chaining.
     */
    rawWhere(query: string, queryParams?: any[]): this;
    /**
     * @description Adds a raw AND WHERE condition to the query.
     * @returns The query_builder instance for chaining.
     */
    rawAndWhere(query: string, queryParams?: any[]): this;
    /**
     * @description Adds a raw OR WHERE condition to the query.
     * @returns The query_builder instance for chaining.
     */
    rawOrWhere(query: string, queryParams?: any[]): this;
    groupBy(...columns: string[]): this;
    groupByRaw(query: string): this;
    orderBy(columns: string, order: "ASC" | "DESC"): this;
    orderByRaw(query: string): this;
    limit(limit: number): this;
    offset(offset: number): this;
    having(column: string, value: any): this;
    having(column: string, operator: BinaryOperatorType$1, value: any): this;
    havingRaw(query: string): this;
    toSql(dbType?: SqlDataSourceType): {
        query: string;
        params: any[];
    };
}

/**
 * @description Defines a property that will be used in the model
 * @returns
 */
declare function property(): PropertyDecorator;
/**
 * @description Defines a dynamic calculated property that is not defined inside the Table, it must be added to a query in order to be retrieved
 * @param propertyName that will be filled inside the dynamicProperty field
 * @returns
 */
declare function dynamicProperty(propertyName: string): PropertyDecorator;
/**
 * @description Returns the propertys of the model, propertys must be decorated with the property decorator
 * @param target Model
 * @returns
 */
declare function getCollectionProperties(target: typeof Collection): string[];
/**
 * @description Returns every dynamicProperty definition
 */
declare function getMongoDynamicProperties(target: typeof Collection): {
    propertyName: string;
    functionName: string;
    dynamicPropertyFn: (...args: any[]) => any;
}[];

declare const _default: {
    Model: typeof Model;
    column: typeof column;
    belongsTo: typeof belongsTo;
    hasOne: typeof hasOne;
    hasMany: typeof hasMany;
    Relation: typeof Relation;
    SqlDataSource: typeof SqlDataSource;
    Migration: typeof Migration;
    getRelations: typeof getRelations;
    getModelColumns: typeof getModelColumns;
    getPrimaryKey: typeof getPrimaryKey;
    Redis: typeof RedisDataSource;
    MongoDataSource: typeof MongoDataSource;
    Collection: typeof Collection;
    property: typeof property;
    dynamicColumn: typeof dynamicColumn;
};

export { type CaseConvention, Collection, type DataSourceInput, Migration, Model, type ModelQueryBuilder, MongoDataSource, type PaginatedData, type PaginationMetadata, RedisDataSource as Redis, type RedisGiveable, type RedisStorable, Relation, SqlDataSource, StandaloneQueryBuilder, belongsTo, column, _default as default, dynamicProperty, getCollectionProperties, getModelColumns, getMongoDynamicProperties, getPrimaryKey, getRelations, hasMany, hasOne, property };
