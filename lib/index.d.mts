import mysql, { Connection } from 'mysql2/promise';
import pg, { Client } from 'pg';
import { DateTime } from 'luxon';
import sqlite3 from 'sqlite3';
import Redis, { RedisOptions } from 'ioredis';
export { RedisOptions } from 'ioredis';

type DataSourceType = "mysql" | "postgres" | "mariadb" | "sqlite" | "redis";
type SqlDataSourceType$1 = Omit<DataSourceType, "redis">;
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
    readonly mysqlOptions?: mysql.PoolOptions;
    readonly pgOptions?: pg.PoolConfig;
}
declare abstract class Datasource {
    protected type: DataSourceType;
    protected host: string;
    protected port: number;
    protected username: string;
    protected password: string;
    protected database: string;
    protected logs: boolean;
    protected constructor(input?: DataSourceInput);
    protected handleRedisSource(input?: DataSourceInput): void;
    protected handleSqlSource(input?: DataSourceInput): void;
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
    protected sqlType: SqlDataSourceType$1;
    constructor(table: string, queryStatements: string[], partialQuery: string, sqlType: SqlDataSourceType$1, columnName?: string, columnReferences?: {
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
    protected sqlType: SqlDataSourceType$1;
    partialQuery: string;
    constructor(table: string, queryStatements: string[], partialQuery: string, sqlType: SqlDataSourceType$1);
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
     * @description If not using postgres, it will automatically be converted in BIGINT AUTO_INCREMENT
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

declare class ColumnBuilderConnector {
    protected table: string;
    protected queryStatements: string[];
    protected partialQuery: string;
    protected sqlType: SqlDataSourceType$1;
    constructor(table: string, queryStatements: string[], partialQuery: string, sqlType: SqlDataSourceType$1);
    newColumn(): ColumnTypeBuilder;
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
declare class Column_builder_alter {
    protected table: string;
    protected queryStatements: string[];
    protected sqlType: SqlDataSourceType$1;
    protected partialQuery: string;
    constructor(table: string, queryStatements: string[], partialQuery: string, sqlType: SqlDataSourceType$1);
    /**
     * @description Add a new column to the table
     * @param columnName { string }
     * @param {DataType} dataType
     * @param {BaseOptions} options
     */
    addColumn(columnName: string, dataType: DataType, options?: BaseOptions): Column_builder_alter;
    /**
     * @description Add a new date column to the table
     * @param columnName { string }
     * @param options { DateOptions }
     */
    addDateColumn(columnName: string, type: "date" | "timestamp", options?: DateOptions & {
        afterColumn?: string;
        notNullable?: boolean;
        default?: string | Date | DateTime;
    }): Column_builder_alter;
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
    }): Column_builder_alter;
    /**
     * @description Drops a column from the table
     * @param columnName
     */
    dropColumn(columnName: string): Column_builder_alter;
    /**
     * @description Renames a column
     * @param oldColumnName
     * @param newColumnName
     */
    renameColumn(oldColumnName: string, newColumnName: string): Column_builder_alter;
    modifyColumnType(columnName: string, newDataType: string, options?: BaseOptions): Column_builder_alter;
    /**
     * @description Renames a table
     * @param oldtable
     * @param newtable
     */
    renameTable(oldtable: string, newtable: string): Column_builder_alter;
    /**
     * @description Set a default value
     * @param columnName
     * @param defaultValue
     */
    setDefaultValue(columnName: string, defaultValue: string): Column_builder_alter;
    /**
     * @description Drop a default value
     * @param columnName
     */
    dropDefaultValue(columnName: string): Column_builder_alter;
    /**
     * @description Add a foreign key
     * @param columnName
     * @param options
     */
    addForeignKey(columnName: string, options: AlterOptions): Column_builder_alter;
    /**
     * @description Drop a foreign key
     * @param columnName
     */
    dropForeignKey(columnName: string): Column_builder_alter;
    /**
     * @description Commits the changes - if omitted, the migration will be run empty
     */
    commit(): void;
}

declare class Schema {
    queryStatements: string[];
    sqlType: SqlDataSourceType$1;
    constructor(sqlType?: SqlDataSourceType$1);
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
     * @returns Column_builder_alter
     */
    alterTable(table: string): Column_builder_alter;
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

declare const selectTemplate: (dbType: SqlDataSourceType$1, typeofModel: typeof Model) => {
    selectAll: string;
    selectById: (id: string) => string;
    selectByIds: (ids: string[]) => string;
    selectColumns: (...columns: string[]) => string;
    selectCount: string;
    selectDistinct: (...columns: string[]) => string;
    selectSum: (column: string) => string;
    orderBy: (columns: string[], order?: "ASC" | "DESC") => string;
    groupBy: (...columns: string[]) => string;
    limit: (limit: number) => string;
    offset: (offset: number) => string;
};

type WhereOperatorType = "=" | "!=" | "<>" | ">" | "<" | ">=" | "<=" | "LIKE" | "ILIKE" | "NOT LIKE" | "NOT ILIKE" | "IN" | "NOT IN" | "BETWEEN" | "NOT BETWEEN";
type BaseValues = string | number | boolean | object;
declare const whereTemplate: (dbType: SqlDataSourceType$1, typeofModel: typeof Model) => {
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

declare class Transaction {
    sqlDataSource: SqlDataSource;
    sqlConnection: SqlConnectionType;
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
    model: typeof Model;
    columnName: string;
    foreignKey?: string;
    relatedModel: string;
    options?: RelationOptions;
    protected constructor(model: typeof Model, columnName: string, options?: RelationOptions);
}

declare class BelongsTo extends Relation {
    type: RelationType$1;
    foreignKey: string;
    constructor(relatedModel: typeof Model, columnName: string, foreignKey: string, options?: RelationOptions);
}

declare class HasMany extends Relation {
    type: RelationType$1;
    foreignKey: string;
    constructor(relatedModel: typeof Model, columnName: string, foreignKey: string, options?: RelationOptions);
}

declare class HasOne extends Relation {
    type: RelationType$1;
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
type SelectableType<T> = ExcludeRelations<Omit<T, "extraColumns">>;
type RelationType<T> = OnlyRelations<Omit<T, "extraColumns">>;
type DynamicColumnType<T> = {
    [k in keyof T]: T[k] extends (...args: any[]) => any ? k : never;
}[keyof T];
type OrderByType = {
    columns: string[];
    type: "ASC" | "DESC";
};
type UnrestrictedFindOneType<T> = {
    select?: string[];
    relations?: RelationType<T>[];
    ignoreHooks?: FetchHooks[];
    dynamicColumns?: DynamicColumnType<T>;
    where?: Record<string, any>;
    useConnection?: SqlDataSource;
    trx?: Transaction;
    throwErrorOnNull?: boolean;
};
type UnrestrictedFindType<T> = Omit<UnrestrictedFindOneType<T>, "throwErrorOnNull"> & {
    orderBy?: OrderByType;
    groupBy?: string[];
    limit?: number;
    offset?: number;
};
type FindOneType<T> = {
    select?: SelectableType<T>[];
    relations?: RelationType<T>[];
    dynamicColumns?: DynamicColumnType<T>;
    where?: WhereType<T>;
    ignoreHooks?: FetchHooks[];
    useConnection?: SqlDataSource;
    trx?: Transaction;
    throwErrorOnNull?: boolean;
};
type FindType<T> = Omit<FindOneType<T>, "throwErrorOnNull"> & {
    orderBy?: OrderByType;
    groupBy?: string[];
    limit?: number;
    offset?: number;
};

declare class SqlModelManagerUtils<T extends Model> {
    private dbType;
    private sqlConnection;
    constructor(dbType: SqlDataSourceType$1, sqlConnection: SqlConnectionType);
    parseInsert(model: T, typeofModel: typeof Model, dbType: SqlDataSourceType$1): {
        query: string;
        params: any[];
    };
    parseMassiveInsert(models: T[], typeofModel: typeof Model, dbType: SqlDataSourceType$1): {
        query: string;
        params: any[];
    };
    parseUpdate(model: T, typeofModel: typeof Model, dbType: SqlDataSourceType$1): {
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

declare class Mysql_query_builder<T extends Model> extends Query_builder<T> {
    protected mysqlConnection: mysql.Connection;
    protected isNestedCondition: boolean;
    protected mysqlModelManagerUtils: SqlModelManagerUtils<T>;
    /**
     * @param table - The name of the table.
     * @param mysqlConnection - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, table: string, mysqlConnection: mysql.Connection, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    one(options?: OneOptions): Promise<T | null>;
    oneOrFail(options?: {
        ignoreHooks?: OneOptions["ignoreHooks"];
    }): Promise<T>;
    many(options?: ManyOptions): Promise<T[]>;
    getCount(options?: {
        ignoreHooks: boolean;
    }): Promise<number>;
    getSum(column: SelectableType<T>): Promise<number>;
    getSum(column: string): Promise<number>;
    paginate(page: number, limit: number, options?: ManyOptions): Promise<PaginatedData<T>>;
    select(...columns: string[]): Mysql_query_builder<T>;
    select(...columns: (SelectableType<T> | "*")[]): Mysql_query_builder<T>;
    join(relationTable: string, primaryColumn: string, foreignColumn: string): Mysql_query_builder<T>;
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): Mysql_query_builder<T>;
    addRelations(relations: RelationType<T>[]): Mysql_query_builder<T>;
    addDynamicColumns(dynamicColumns: DynamicColumnType<T>[]): ModelQueryBuilder<T>;
    whereBuilder(cb: (queryBuilder: Mysql_query_builder<T>) => void): this;
    orWhereBuilder(cb: (queryBuilder: Mysql_query_builder<T>) => void): this;
    andWhereBuilder(cb: (queryBuilder: Mysql_query_builder<T>) => void): this;
    when<O>(value: O, cb: (value: O, query: ModelQueryBuilder<T>) => void): this;
    where(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    where(column: string, operator: WhereOperatorType, value: BaseValues): this;
    where(column: SelectableType<T> | string, value: BaseValues): this;
    andWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    andWhere(column: string, operator: WhereOperatorType, value: BaseValues): this;
    andWhere(column: SelectableType<T> | string, value: BaseValues): this;
    orWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    orWhere(column: string, operator: WhereOperatorType, value: BaseValues): this;
    orWhere(column: SelectableType<T> | string, value: BaseValues): this;
    whereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    whereBetween(column: string, min: BaseValues, max: BaseValues): this;
    andWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    andWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    orWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    whereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    whereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    orWhereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    whereIn(column: SelectableType<T>, values: BaseValues[]): this;
    whereIn(column: string, values: BaseValues[]): this;
    andWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
    andWhereIn(column: string, values: BaseValues[]): this;
    orWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
    orWhereIn(column: string, values: BaseValues[]): this;
    whereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
    whereNotIn(column: string, values: BaseValues[]): this;
    orWhereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
    orWhereNotIn(column: string, values: BaseValues[]): this;
    whereNull(column: SelectableType<T>): this;
    whereNull(column: string): this;
    andWhereNull(column: SelectableType<T>): this;
    andWhereNull(column: string): this;
    orWhereNull(column: SelectableType<T>): this;
    orWhereNull(column: string): this;
    whereNotNull(column: SelectableType<T>): this;
    whereNotNull(column: string): this;
    andWhereNotNull(column: SelectableType<T>): this;
    andWhereNotNull(column: string): this;
    orWhereNotNull(column: SelectableType<T>): this;
    orWhereNotNull(column: string): this;
    rawWhere(query: string): this;
    rawAndWhere(query: string): this;
    rawOrWhere(query: string): this;
    groupBy(...columns: SelectableType<T>[]): this;
    groupBy(...columns: string[]): this;
    orderBy(columns: SelectableType<T>[], order: "ASC" | "DESC"): this;
    orderBy(columns: string[], order: "ASC" | "DESC"): this;
    limit(limit: number): this;
    offset(offset: number): this;
    copy(): ModelQueryBuilder<T>;
    protected groupFooterQuery(): string;
}

declare class Postgres_query_builder<T extends Model> extends Query_builder<T> {
    protected pgClient: Client;
    protected isNestedCondition: boolean;
    protected postgresModelManagerUtils: SqlModelManagerUtils<T>;
    constructor(model: typeof Model, table: string, pgClient: Client, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    select(...columns: string[]): Postgres_query_builder<T>;
    select(...columns: (SelectableType<T> | "*")[]): Postgres_query_builder<T>;
    one(options?: OneOptions): Promise<T | null>;
    oneOrFail(options?: {
        ignoreHooks: OneOptions["ignoreHooks"];
    }): Promise<T>;
    many(options?: ManyOptions): Promise<T[]>;
    getCount(options?: {
        ignoreHooks: boolean;
    }): Promise<number>;
    getSum(column: SelectableType<T>): Promise<number>;
    getSum(column: string): Promise<number>;
    paginate(page: number, limit: number, options?: ManyOptions): Promise<PaginatedData<T>>;
    join(relationTable: string, primaryColumn: string, foreignColumn: string): Postgres_query_builder<T>;
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): Postgres_query_builder<T>;
    addRelations(relations: RelationType<T>[]): Postgres_query_builder<T>;
    addDynamicColumns(dynamicColumns: DynamicColumnType<T>[]): ModelQueryBuilder<T>;
    whereBuilder(cb: (queryBuilder: Postgres_query_builder<T>) => void): this;
    orWhereBuilder(cb: (queryBuilder: Postgres_query_builder<T>) => void): this;
    andWhereBuilder(cb: (queryBuilder: Postgres_query_builder<T>) => void): this;
    when<O>(value: O, cb: (value: O, query: ModelQueryBuilder<T>) => void): this;
    where(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    where(column: string, operator: WhereOperatorType, value: BaseValues): this;
    where(column: SelectableType<T> | string, value: BaseValues): this;
    andWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    andWhere(column: string, operator: WhereOperatorType, value: BaseValues): this;
    andWhere(column: SelectableType<T> | string, value: BaseValues): this;
    orWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    orWhere(column: string, operator: WhereOperatorType, value: BaseValues): this;
    orWhere(column: SelectableType<T> | string, value: BaseValues): this;
    whereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    whereBetween(column: string, min: BaseValues, max: BaseValues): this;
    andWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    andWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    orWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    whereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    whereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    orWhereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    whereIn(column: SelectableType<T>, values: BaseValues[]): this;
    whereIn(column: string, values: BaseValues[]): this;
    andWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
    andWhereIn(column: string, values: BaseValues[]): this;
    orWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
    orWhereIn(column: string, values: BaseValues[]): this;
    whereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
    whereNotIn(column: string, values: BaseValues[]): this;
    orWhereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
    orWhereNotIn(column: string, values: BaseValues[]): this;
    whereNull(column: SelectableType<T>): this;
    whereNull(column: string): this;
    andWhereNull(column: SelectableType<T>): this;
    andWhereNull(column: string): this;
    orWhereNull(column: SelectableType<T>): this;
    orWhereNull(column: string): this;
    whereNotNull(column: SelectableType<T>): this;
    whereNotNull(column: string): this;
    andWhereNotNull(column: SelectableType<T>): this;
    andWhereNotNull(column: string): this;
    orWhereNotNull(column: SelectableType<T>): this;
    orWhereNotNull(column: string): this;
    rawWhere(query: string): this;
    rawAndWhere(query: string): this;
    rawOrWhere(query: string): this;
    groupBy(...columns: SelectableType<T>[]): this;
    groupBy(...columns: string[]): this;
    orderBy(columns: SelectableType<T>[], order: "ASC" | "DESC"): this;
    orderBy(columns: string[], order: "ASC" | "DESC"): this;
    limit(limit: number): this;
    offset(offset: number): this;
    copy(): ModelQueryBuilder<T>;
    protected groupFooterQuery(): string;
}

declare class Sql_lite_query_builder<T extends Model> extends Query_builder<T> {
    protected sqLiteConnection: sqlite3.Database;
    protected isNestedCondition: boolean;
    protected sqliteModelManagerUtils: SqlModelManagerUtils<T>;
    /**
     * @param table - The name of the table.
     * @param sqLiteConnection - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, table: string, sqLiteConnection: sqlite3.Database, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    one(options?: OneOptions): Promise<T | null>;
    oneOrFail(options?: {
        ignoreHooks: OneOptions["ignoreHooks"];
    }): Promise<T>;
    many(options?: ManyOptions): Promise<T[]>;
    raw<T>(query: string, params?: any[]): Promise<T[]>;
    getCount(options?: {
        ignoreHooks: boolean;
    }): Promise<number>;
    getSum(column: SelectableType<T>): Promise<number>;
    getSum(column: string): Promise<number>;
    paginate(page: number, limit: number, options?: ManyOptions): Promise<PaginatedData<T>>;
    select(...columns: string[]): Sql_lite_query_builder<T>;
    select(...columns: (SelectableType<T> | "*")[]): Sql_lite_query_builder<T>;
    join(relationTable: string, primaryColumn: string, foreignColumn: string): Sql_lite_query_builder<T>;
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): Sql_lite_query_builder<T>;
    addRelations(relations: RelationType<T>[]): Sql_lite_query_builder<T>;
    addDynamicColumns(dynamicColumns: DynamicColumnType<T>[]): ModelQueryBuilder<T>;
    whereBuilder(cb: (queryBuilder: Sql_lite_query_builder<T>) => void): this;
    orWhereBuilder(cb: (queryBuilder: Sql_lite_query_builder<T>) => void): this;
    andWhereBuilder(cb: (queryBuilder: Sql_lite_query_builder<T>) => void): this;
    when<O>(value: O, cb: (value: O, query: ModelQueryBuilder<T>) => void): this;
    where(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    where(column: string, operator: WhereOperatorType, value: BaseValues): this;
    where(column: SelectableType<T> | string, value: BaseValues): this;
    andWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    andWhere(column: string, operator: WhereOperatorType, value: BaseValues): this;
    andWhere(column: SelectableType<T> | string, value: BaseValues): this;
    orWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    orWhere(column: string, operator: WhereOperatorType, value: BaseValues): this;
    orWhere(column: SelectableType<T> | string, value: BaseValues): this;
    whereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    whereBetween(column: string, min: BaseValues, max: BaseValues): this;
    andWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    andWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    orWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    whereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    whereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    orWhereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    whereIn(column: SelectableType<T>, values: BaseValues[]): this;
    whereIn(column: string, values: BaseValues[]): this;
    andWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
    andWhereIn(column: string, values: BaseValues[]): this;
    orWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
    orWhereIn(column: string, values: BaseValues[]): this;
    whereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
    whereNotIn(column: string, values: BaseValues[]): this;
    orWhereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
    orWhereNotIn(column: string, values: BaseValues[]): this;
    whereNull(column: SelectableType<T>): this;
    whereNull(column: string): this;
    andWhereNull(column: SelectableType<T>): this;
    andWhereNull(column: string): this;
    orWhereNull(column: SelectableType<T>): this;
    orWhereNull(column: string): this;
    whereNotNull(column: SelectableType<T>): this;
    whereNotNull(column: string): this;
    andWhereNotNull(column: SelectableType<T>): this;
    andWhereNotNull(column: string): this;
    orWhereNotNull(column: SelectableType<T>): this;
    orWhereNotNull(column: string): this;
    rawWhere(query: string): this;
    rawAndWhere(query: string): this;
    rawOrWhere(query: string): this;
    groupBy(...columns: SelectableType<T>[]): this;
    groupBy(...columns: string[]): this;
    orderBy(columns: SelectableType<T>[], order: "ASC" | "DESC"): this;
    orderBy(columns: string[], order: "ASC" | "DESC"): this;
    limit(limit: number): this;
    offset(offset: number): this;
    copy(): ModelQueryBuilder<T>;
    protected groupFooterQuery(): string;
    private promisifyQuery;
}

/**
 * @description The abstract class for query builders for selecting data.
 */
type ModelQueryBuilder<T extends Model> = Mysql_query_builder<T> | Postgres_query_builder<T> | Sql_lite_query_builder<T>;
type FetchHooks = "beforeFetch" | "afterFetch";
type OneOptions = {
    throwErrorOnNull?: boolean;
    ignoreHooks?: FetchHooks[];
};
type ManyOptions = {
    ignoreHooks?: FetchHooks[];
};
declare abstract class Query_builder<T extends Model> {
    protected sqlDataSource: SqlDataSource;
    protected selectQuery: string;
    protected joinQuery: string;
    protected relations: string[];
    protected dynamicColumns: string[];
    protected whereQuery: string;
    protected groupByQuery: string;
    protected orderByQuery: string;
    protected limitQuery: string;
    protected offsetQuery: string;
    protected params: BaseValues[];
    protected model: typeof Model;
    protected table: string;
    protected logs: boolean;
    protected selectTemplate: ReturnType<typeof selectTemplate>;
    protected whereTemplate: ReturnType<typeof whereTemplate>;
    /**
     * @description Constructs a Mysql_query_builder instance.
     * @param model - The model class associated with the table.
     * @param table - The name of the table.
     * @param logs - A boolean indicating whether to log queries.
     */
    protected constructor(model: typeof Model, table: string, logs: boolean, sqlDataSource: SqlDataSource);
    /**
     * @description Executes the query and retrieves the first result.
     * @returns A Promise resolving to the first result or null.
     */
    abstract one(options: OneOptions): Promise<T | null>;
    /**
     * @description Executes the query and retrieves the first result. Fail if no result is found.
     */
    abstract oneOrFail(options?: {
        ignoreHooks?: OneOptions["ignoreHooks"];
    }): Promise<T>;
    /**
     * @description Executes the query and retrieves multiple results.
     * @returns A Promise resolving to an array of results.
     */
    abstract many(options: ManyOptions): Promise<T[]>;
    /**
     * @description Executes the query and retrieves the count of results, it ignores all select, group by, order by, limit and offset clauses if they are present.
     * @returns A Promise resolving to the count of results.
     */
    abstract getCount(options: {
        ignoreHooks: boolean;
    }): Promise<number>;
    /**
     * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
     * @param column - The column to sum.
     * @returns A Promise resolving to the sum of the column.
     */
    abstract getSum(column: string, options: {
        ignoreHooks: boolean;
    }): Promise<number>;
    /**
     * @description Executes the query and retrieves multiple results.
     * @returns A Promise resolving to an array of results.
     */
    abstract paginate(page: number, limit: number, options?: ManyOptions): Promise<PaginatedData<T>>;
    /**
     * @description Adds a SELECT condition to the query.
     * @param columns - The columns to select.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract select(...columns: string[]): ModelQueryBuilder<T>;
    abstract select(...columns: (SelectableType<T> | "*")[]): ModelQueryBuilder<T>;
    abstract select(...columns: (SelectableType<T> | "*" | string)[]): ModelQueryBuilder<T>;
    /**
     * @description Adds a JOIN condition to the query.
     * @param table
     * @param primaryColumn
     * @param foreignColumn
     */
    abstract join(table: string, primaryColumn: string, foreignColumn: string): ModelQueryBuilder<T>;
    /**
     * @description Adds a LEFT JOIN condition to the query.
     * @param table
     * @param primaryColumn
     * @param foreignColumn
     */
    abstract leftJoin(table: string, primaryColumn: string, foreignColumn: string): ModelQueryBuilder<T>;
    /**
     * @description Adds a relation to the query.
     * @param relations - The relations to add.
     */
    abstract addRelations(relations: RelationType<T>[]): ModelQueryBuilder<T>;
    /**
     * @description Adds a the selected dynamic columns from the model into the final model
     * @param relations - The dynamic columns to add.
     */
    abstract addDynamicColumns(dynamicColumns: DynamicColumnType<T>[]): ModelQueryBuilder<T>;
    /**
     * @description Accepts a value and executes a callback only of the value exists
     * @param {any} value
     * @param callback
     */
    abstract when(value: any, cb: (value: any, query: ModelQueryBuilder<T>) => void): ModelQueryBuilder<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    abstract whereBuilder(cb: (queryBuilder: ModelQueryBuilder<T>) => void): ModelQueryBuilder<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    abstract andWhereBuilder(cb: (queryBuilder: ModelQueryBuilder<T>) => void): ModelQueryBuilder<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    abstract orWhereBuilder(cb: (queryBuilder: ModelQueryBuilder<T>) => void): ModelQueryBuilder<T>;
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract where(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): ModelQueryBuilder<T>;
    abstract where(column: string, operator: WhereOperatorType, value: BaseValues): ModelQueryBuilder<T>;
    abstract where(column: SelectableType<T> | string, value: BaseValues): ModelQueryBuilder<T>;
    abstract where(column: SelectableType<T> | string, operator: WhereOperatorType, value: BaseValues): ModelQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract andWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): ModelQueryBuilder<T>;
    abstract andWhere(column: string, operator: WhereOperatorType, value: BaseValues): ModelQueryBuilder<T>;
    abstract andWhere(column: SelectableType<T> | string, value: BaseValues): ModelQueryBuilder<T>;
    abstract andWhere(column: SelectableType<T> | string, operator: WhereOperatorType, value: BaseValues): ModelQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract orWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): ModelQueryBuilder<T>;
    abstract orWhere(column: string, operator: WhereOperatorType, value: BaseValues): ModelQueryBuilder<T>;
    abstract orWhere(column: SelectableType<T> | string, value: BaseValues): ModelQueryBuilder<T>;
    abstract orWhere(column: SelectableType<T> | string, operator: WhereOperatorType, value: BaseValues): ModelQueryBuilder<T>;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract whereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract whereBetween(column: string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract whereBetween(column: SelectableType<T> | string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract andWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract andWhereBetween(column: string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract andWhereBetween(column: SelectableType<T> | string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract orWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract orWhereBetween(column: string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract orWhereBetween(column: SelectableType<T> | string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract whereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract whereNotBetween(column: string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract whereNotBetween(column: SelectableType<T> | string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract orWhereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    abstract orWhereNotBetween(column: SelectableType<T> | string, min: BaseValues, max: BaseValues): ModelQueryBuilder<T>;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract whereIn(column: SelectableType<T>, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract whereIn(column: string, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract whereIn(column: SelectableType<T> | string, values: BaseValues[]): ModelQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract andWhereIn(column: SelectableType<T>, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract andWhereIn(column: string, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract andWhereIn(column: SelectableType<T> | string, values: BaseValues[]): ModelQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract orWhereIn(column: string, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract orWhereIn(column: SelectableType<T>, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract orWhereIn(column: SelectableType<T> | string, values: BaseValues[]): ModelQueryBuilder<T>;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract whereNotIn(column: SelectableType<T>, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract whereNotIn(column: string, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract whereNotIn(column: SelectableType<T> | string, values: BaseValues[]): ModelQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract orWhereNotIn(column: SelectableType<T>, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract orWhereNotIn(column: string, values: BaseValues[]): ModelQueryBuilder<T>;
    abstract orWhereNotIn(column: SelectableType<T> | string, values: BaseValues[]): ModelQueryBuilder<T>;
    /**
     * @description Adds a WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract whereNull(column: SelectableType<T>): ModelQueryBuilder<T>;
    abstract whereNull(column: string): ModelQueryBuilder<T>;
    abstract whereNull(column: SelectableType<T> | string): ModelQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract andWhereNull(column: SelectableType<T>): ModelQueryBuilder<T>;
    abstract andWhereNull(column: string): ModelQueryBuilder<T>;
    abstract andWhereNull(column: SelectableType<T> | string): ModelQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract orWhereNull(column: SelectableType<T>): ModelQueryBuilder<T>;
    abstract orWhereNull(column: string): ModelQueryBuilder<T>;
    abstract orWhereNull(column: SelectableType<T> | string): ModelQueryBuilder<T>;
    /**
     * @description Adds a WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract whereNotNull(column: SelectableType<T>): ModelQueryBuilder<T>;
    abstract whereNotNull(column: string): ModelQueryBuilder<T>;
    abstract whereNotNull(column: SelectableType<T> | string): ModelQueryBuilder<T>;
    /**
     * @description Adds an AND WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract andWhereNotNull(column: SelectableType<T>): ModelQueryBuilder<T>;
    abstract andWhereNotNull(column: string): ModelQueryBuilder<T>;
    abstract andWhereNotNull(column: SelectableType<T> | string): ModelQueryBuilder<T>;
    /**
     * @description Adds an OR WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract orWhereNotNull(column: SelectableType<T>): ModelQueryBuilder<T>;
    abstract orWhereNotNull(column: string): ModelQueryBuilder<T>;
    abstract orWhereNotNull(column: SelectableType<T> | string): ModelQueryBuilder<T>;
    /**
     * @description Adds a raw WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract rawWhere(query: string): ModelQueryBuilder<T>;
    /**
     * @description Adds a raw AND WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract rawAndWhere(query: string): ModelQueryBuilder<T>;
    /**
     * @description Adds a raw OR WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract rawOrWhere(query: string, params: []): ModelQueryBuilder<T>;
    /**
     * @description Adds GROUP BY conditions to the query.
     * @param columns - The columns to group by.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract groupBy(...columns: SelectableType<T>[]): ModelQueryBuilder<T>;
    abstract groupBy(...columns: string[]): ModelQueryBuilder<T>;
    abstract groupBy(...columns: (SelectableType<T> | string)[]): ModelQueryBuilder<T>;
    /**
     * @description Adds ORDER BY conditions to the query.
     * @param column - The column to order by.
     * @param order - The order direction, either "ASC" or "DESC".
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract orderBy(columns: SelectableType<T>[], order: "ASC" | "DESC"): ModelQueryBuilder<T>;
    abstract orderBy(columns: string[], order: "ASC" | "DESC"): ModelQueryBuilder<T>;
    abstract orderBy(columns: (SelectableType<T> | string)[], order: "ASC" | "DESC"): ModelQueryBuilder<T>;
    /**
     * @description Adds a LIMIT condition to the query.
     * @param limit - The maximum number of rows to return.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract limit(limit: number): ModelQueryBuilder<T>;
    /**
     * @description Adds an OFFSET condition to the query.
     * @param offset - The number of rows to skip.
     * @returns The Mysql_query_builder instance for chaining.
     */
    abstract offset(offset: number): ModelQueryBuilder<T>;
    /**
     * @description Returns a copy of the query builder instance.
     * @returns A copy of the query builder instance.
     */
    abstract copy(): ModelQueryBuilder<T>;
    protected groupFooterQuery(): string;
    protected mergeRawPacketIntoModel(model: T, row: any, typeofModel: typeof Model): Promise<void>;
}

type CaseConvention = "camel" | "snake" | "none" | RegExp | ((column: string) => string);

declare abstract class Where_query_builder<T extends Model> {
    protected sqlDataSource: SqlDataSource;
    protected whereQuery: string;
    protected whereParams: BaseValues[];
    protected model: typeof Model;
    protected table: string;
    protected logs: boolean;
    protected whereTemplate: ReturnType<typeof whereTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a query_builder instance.
     * @param model - The model class associated with the table.
     * @param table - The name of the table.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, table: string, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    /**
     * @description Accepts a value and executes a callback only of the value exists
     * @param {any} value
     * @param callback
     */
    when(value: any, cb: (value: any, query: Where_query_builder<T>) => void): this;
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The query_builder instance for chaining.
     */
    where(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    where(column: string, operator: WhereOperatorType, value: BaseValues): this;
    where(column: SelectableType<T> | string, value: BaseValues): this;
    /**
     * @description Adds an AND WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The query_builder instance for chaining.
     */
    andWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    andWhere(column: string, operator: WhereOperatorType, value: BaseValues): this;
    andWhere(column: SelectableType<T> | string, value: BaseValues): this;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The query_builder instance for chaining.
     */
    orWhere(column: SelectableType<T>, operator: WhereOperatorType, value: BaseValues): this;
    orWhere(column: string, operator: WhereOperatorType, value: BaseValues): this;
    orWhere(column: SelectableType<T> | string, value: BaseValues): this;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The query_builder instance for chaining.
     */
    whereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    whereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The query_builder instance for chaining.
     */
    andWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    andWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The query_builder instance for chaining.
     */
    orWhereBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The query_builder instance for chaining.
     */
    whereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    whereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The query_builder instance for chaining.
     */
    orWhereNotBetween(column: SelectableType<T>, min: BaseValues, max: BaseValues): this;
    orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The query_builder instance for chaining.
     */
    whereIn(column: SelectableType<T>, values: BaseValues[]): this;
    whereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The query_builder instance for chaining.
     */
    andWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
    andWhereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The query_builder instance for chaining.
     */
    orWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
    orWhereIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The query_builder instance for chaining.
     */
    whereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
    whereNotIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The query_builder instance for chaining.
     */
    orWhereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
    orWhereNotIn(column: string, values: BaseValues[]): this;
    /**
     * @description Adds a WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The query_builder instance for chaining.
     */
    whereNull(column: SelectableType<T>): this;
    whereNull(column: string): this;
    /**
     * @description Adds an AND WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The query_builder instance for chaining.
     */
    andWhereNull(column: SelectableType<T>): this;
    andWhereNull(column: string): this;
    /**
     * @description Adds an OR WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The query_builder instance for chaining.
     */
    orWhereNull(column: SelectableType<T>): this;
    orWhereNull(column: string): this;
    /**
     * @description Adds a WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The query_builder instance for chaining.
     */
    whereNotNull(column: SelectableType<T>): this;
    whereNotNull(column: string): this;
    /**
     * @description Adds an AND WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The query_builder instance for chaining.
     */
    andWhereNotNull(column: SelectableType<T>): this;
    andWhereNotNull(column: string): this;
    /**
     * @description Adds an OR WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The query_builder instance for chaining.
     */
    orWhereNotNull(column: SelectableType<T>): this;
    orWhereNotNull(column: string): this;
    /**
     * @description Adds a raw WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The query_builder instance for chaining.
     */
    rawWhere(query: string): this;
    /**
     * @description Adds a raw AND WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The query_builder instance for chaining.
     */
    rawAndWhere(query: string): this;
    /**
     * @description Adds a raw OR WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The query_builder instance for chaining.
     */
    rawOrWhere(query: string): this;
}

declare const updateTemplate: (dbType: SqlDataSourceType$1, typeofModel: typeof Model) => {
    update: (columns: string[], values: any[], primaryKey?: string, primaryKeyValue?: string | undefined) => {
        query: string;
        params: any[];
    };
    massiveUpdate: (columns: string[], values: any[], whereClause: string, joinClause?: string) => {
        query: string;
        params: any[];
    };
};

type WithDataOptions = {
    ignoreBeforeUpdateHook?: boolean;
};
declare abstract class ModelUpdateQueryBuilder<T extends Model> extends Where_query_builder<T> {
    protected abstract sqlConnection: SqlConnectionType;
    protected abstract joinQuery: string;
    protected abstract updateTemplate: ReturnType<typeof updateTemplate>;
    protected abstract isNestedCondition: boolean;
    /**
     * @description Updates a record in the database.
     * @param data
     * @param trx
     * @returns The number of affected rows.
     */
    abstract withData(data: Partial<T>, options?: WithDataOptions): Promise<number>;
    abstract join(relationTable: string, primaryColumn: string, foreignColumn: string): ModelUpdateQueryBuilder<T>;
    abstract leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): ModelUpdateQueryBuilder<T>;
    abstract whereBuilder(cb: (queryBuilder: ModelUpdateQueryBuilder<T>) => void): ModelUpdateQueryBuilder<T>;
    abstract orWhereBuilder(cb: (queryBuilder: ModelUpdateQueryBuilder<T>) => void): ModelUpdateQueryBuilder<T>;
    abstract andWhereBuilder(cb: (queryBuilder: ModelUpdateQueryBuilder<T>) => void): ModelUpdateQueryBuilder<T>;
}

declare const deleteTemplate: (table: string, dbType: SqlDataSourceType$1) => {
    delete: (column: string, value: string | number | boolean | Date) => {
        query: string;
        params: (string | number | boolean | Date)[];
    };
    massiveDelete: (whereClause: string, joinClause?: string) => string;
};

type DeleteOptions = {
    ignoreBeforeDeleteHook?: boolean;
};
type SoftDeleteOptions<T> = {
    column?: SelectableType<T>;
    value?: string | number | boolean;
    ignoreBeforeDeleteHook?: boolean;
};
declare abstract class ModelDeleteQueryBuilder<T extends Model> extends Where_query_builder<T> {
    protected abstract sqlConnection: SqlConnectionType;
    protected abstract joinQuery: string;
    protected abstract updateTemplate: ReturnType<typeof updateTemplate>;
    protected abstract deleteTemplate: ReturnType<typeof deleteTemplate>;
    protected abstract isNestedCondition: boolean;
    /**
     * @description soft Deletes Records from the database.
     * @param options - The options for the soft delete, including the column to soft delete, the value to set the column to, and the transaction to run the query in.
     * @default column - 'deletedAt'
     * @default value - The current date and time.
     * @default ignoreBeforeDeleteHook - false
     * @default trx - undefined
     * @returns The number of affected rows.
     */
    abstract softDelete(options?: SoftDeleteOptions<T>): Promise<number>;
    /**
     * @description Deletes Records from the database for the current query.
     * @param trx - The transaction to run the query in.
     * @returns The number of affected rows.
     */
    abstract delete(options?: DeleteOptions): Promise<number>;
    abstract join(relationTable: string, primaryColumn: string, foreignColumn: string): ModelDeleteQueryBuilder<T>;
    abstract leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): ModelDeleteQueryBuilder<T>;
    abstract whereBuilder(cb: (queryBuilder: ModelDeleteQueryBuilder<T>) => void): this;
    abstract orWhereBuilder(cb: (queryBuilder: ModelDeleteQueryBuilder<T>) => void): this;
    abstract andWhereBuilder(cb: (queryBuilder: ModelDeleteQueryBuilder<T>) => void): this;
}

type BaseModelMethodOptions = {
    useConnection?: SqlDataSource;
    trx?: Transaction;
};
/**
 * @description Represents a Table in the Database
 */
declare abstract class Model {
    /**
     * @description The sql instance generated by SqlDataSource.connect
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
     * @description Defines the case convention for the model
     * @type {CaseConvention}
     */
    static modelCaseConvention: CaseConvention;
    /**
     * @description Defines the case convention for the database, this should be the case convention you use in your database
     * @type {CaseConvention}
     */
    static databaseCaseConvention: CaseConvention;
    /**
     * @description Extra columns for the model, all data retrieved from the database that is not part of the model will be stored here
     */
    extraColumns: {
        [key: string]: any;
    };
    /**
     * @description Constructor for the model, it's not meant to be used directly, it just initializes the extraColumns, it's advised to only use the static methods to interact with the Model instances
     */
    constructor();
    /**
     * @description Gives a query instance for the given model
     * @param model
     * @returns {ModelQueryBuilder<T>}
     */
    static query<T extends Model>(this: new () => T | typeof Model, options?: BaseModelMethodOptions): ModelQueryBuilder<T>;
    /**
     * @description Finds the first record in the database
     * @param model
     * @param {FindType} options
     * @returns {Promise<T[]>}
     */
    static first<T extends Model>(this: new () => T | typeof Model, options?: OneOptions & BaseModelMethodOptions): Promise<T | null>;
    /**
     * @description Finds records for the given model
     * @param model
     * @param {FindType} options
     * @returns {Promise<T[]>}
     */
    static find<T extends Model>(this: new () => T | typeof Model, options?: FindType<T> | UnrestrictedFindType<T>): Promise<T[]>;
    /**
     * @description Finds a record for the given model
     * @param model
     * @param {FindOneType} options
     * @returns {Promise<T | null>}
     */
    static findOne<T extends Model>(this: new () => T | typeof Model, options: FindOneType<T> | UnrestrictedFindOneType<T>): Promise<T | null>;
    /**
     * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
     * @param model
     * @param {number | string} id
     * @returns {Promise<T | null>}
     */
    static findOneByPrimaryKey<T extends Model>(this: new () => T | typeof Model, value: string | number | boolean, options?: {
        throwErrorOnNull: boolean;
    } & BaseModelMethodOptions): Promise<T | null>;
    /**
     * @description Refreshes a model from the database, the model must have a primary key defined
     * @param model
     */
    static refresh<T extends Model>(this: new () => T | typeof Model, model: T, options?: {
        throwErrorOnNull: boolean;
    } & BaseModelMethodOptions): Promise<T | null>;
    /**
     * @description Saves a new record to the database
     * @description While using mysql, it will return records only if the primary key is auto incrementing integer, else it will always return null
     * @param model
     * @param {Model} modelData
     * @param trx
     * @returns {Promise<T | null>}
     */
    static insert<T extends Model>(this: new () => T | typeof Model, modelData: Partial<T>, options?: BaseModelMethodOptions): Promise<T | null>;
    /**
     * @description Saves multiple records to the database
     * @description WHile using mysql, it will return records only if the primary key is auto incrementing integer, else it will always return []
     * @param model
     * @param {Model} modelsData
     * @param trx
     * @returns {Promise<T[]>}
     */
    static insertMany<T extends Model>(this: new () => T | typeof Model, modelsData: Partial<T>[], options?: BaseModelMethodOptions): Promise<T[]>;
    /**
     * @description Updates a record to the database
     * @param model
     * @param {Model} modelInstance
     * @param trx
     * @returns
     */
    static updateRecord<T extends Model>(this: new () => T | typeof Model, modelInstance: T, options?: BaseModelMethodOptions): Promise<T | null>;
    /**
     * @description Finds the first record or creates a new one if it doesn't exist
     * @param model
     * @param {Partial<T>} searchCriteria
     * @param {Partial<T>} createData
     */
    static firstOrCreate<T extends Model>(this: new () => T | typeof Model, searchCriteria: Partial<T>, createData: Partial<T>, options?: BaseModelMethodOptions): Promise<T>;
    /**
     * @description Updates or creates a new record
     * @param {Partial<T>} searchCriteria
     * @param {Partial<T>} data
     * @param options - The options to update the record on conflict, default is true
     */
    static upsert<T extends Model>(this: new () => T | typeof Model, searchCriteria: Partial<T>, data: Partial<T>, options?: {
        updateOnConflict?: boolean;
    } & BaseModelMethodOptions): Promise<T>;
    /**
     * @description Updates or creates multiple records
     * @param {Partial<T>} searchCriteria
     * @param {Partial<T>} data
     * @param options - The options to update the record on conflict, default is true
     * @returns - The updated or created records
     */
    static upsertMany<T extends Model>(this: new () => T | typeof Model, searchCriteria: SelectableType<T>[], data: Partial<T>[], options?: {
        updateOnConflict?: boolean;
    } & BaseModelMethodOptions): Promise<T[]>;
    /**
     * @description Updates records to the database
     * @param model
     * @param {Model} modelInstance
     * @param trx
     * @returns Update query builder
     */
    static update<T extends Model>(this: new () => T | typeof Model, options?: BaseModelMethodOptions): ModelUpdateQueryBuilder<T>;
    /**
     * @description Gives a Delete query builder instance
     * @param model
     * @param {Model} modelInstance
     * @param trx
     * @returns
     */
    static deleteQuery<T extends Model>(this: new () => T | typeof Model, options?: BaseModelMethodOptions): ModelDeleteQueryBuilder<T>;
    /**
     * @description Deletes a record to the database
     * @param model
     * @param {Model} modelInstance
     * @param trx
     * @returns
     */
    static deleteRecord<T extends Model>(this: new () => T | typeof Model, modelInstance: T, options?: BaseModelMethodOptions): Promise<T | null>;
    /**
     * @description Soft Deletes a record to the database
     * @param model
     * @param {Model} modelInstance
     * @param options - The options to soft delete the record, column and value - Default is 'deletedAt' for column and the current date and time for value, string is always counted as a Date stringified as new Date().toString()
     * @param trx
     * @returns
     */
    static softDelete<T extends Model>(this: new () => T | typeof Model, modelInstance: T, options?: {
        column?: string;
        value?: string | number | boolean;
    } & BaseModelMethodOptions): Promise<T>;
    /**
     * @description Adds dynamic columns to the model that are not defined in the Table and are defined in the model
     * @description It does not support custom connection or transaction
     * @param model
     * @param data
     * @param dynamicColumns
     * @returns
     */
    static addDynamicColumns<T extends Model>(this: new () => T | typeof Model, data: T | T[] | PaginatedData<T>, dynamicColumns: DynamicColumnType<T>[]): Promise<T | T[] | PaginatedData<T>>;
    /**
     * @description Merges the provided data with the instance
     * @param instance
     * @param data
     * @returns {void}
     */
    static combineProps<T extends Model>(instance: T, data: Partial<T>): void;
    /**
     * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
     * @param queryBuilder
     */
    static beforeFetch(queryBuilder: ModelQueryBuilder<any>): void;
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
    static beforeUpdate(queryBuilder: ModelUpdateQueryBuilder<any>): void;
    /**
     * @description Adds a beforeDelete clause to the model, adding the ability to modify the query before deleting the data
     * @param data
     */
    static beforeDelete(queryBuilder: ModelDeleteQueryBuilder<any>): void;
    /**
     * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
     * @param data
     * @returns {T}
     */
    static afterFetch(data: Model[]): Promise<Model[]>;
    /**
     * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method, this is done automatically when using the static methods
     * @description This method is meant to be used only if you want to establish sql instance of the model directly
     * @internal
     * @returns {void}
     */
    static establishConnection(): void;
    /**
     * @description Gives the correct model manager with the correct connection based on the options provided
     * @param this
     * @param options
     * @returns
     */
    private static getModelManager;
}

declare abstract class Abstract_model_manager<T extends Model> {
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
    abstract query(): Query_builder<T>;
    /**
     * @description Returns an update query builder
     */
    abstract update(): ModelUpdateQueryBuilder<T>;
    /**
     * @description Returns a delete query builder
     */
    abstract deleteQuery(): ModelDeleteQueryBuilder<T>;
}

declare class Mysql_update_query_builder<T extends Model> extends ModelUpdateQueryBuilder<T> {
    protected sqlConnection: Connection;
    protected joinQuery: string;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a Mysql_query_builder instance.
     * @param model - The model class associated with the table.
     * @param table - The name of the table.
     * @param mysqlConnection - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, table: string, mysqlConnection: Connection, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    withData(data: Partial<T>, options?: WithDataOptions): Promise<number>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): Mysql_update_query_builder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): Mysql_update_query_builder<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    whereBuilder(cb: (queryBuilder: Mysql_update_query_builder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: Mysql_update_query_builder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: Mysql_update_query_builder<T>) => void): this;
}

declare class Mysql_delete_query_builder<T extends Model> extends ModelDeleteQueryBuilder<T> {
    protected sqlConnection: Connection;
    protected joinQuery: string;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected deleteTemplate: ReturnType<typeof deleteTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a Mysql_query_builder instance.
     * @param model - The model class associated with the table.
     * @param table - The name of the table.
     * @param mysqlConnection - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, table: string, mysql: Connection, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    softDelete(options?: SoftDeleteOptions<T>): Promise<number>;
    delete(options?: DeleteOptions): Promise<number>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): Mysql_delete_query_builder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): Mysql_delete_query_builder<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    whereBuilder(cb: (queryBuilder: Mysql_delete_query_builder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: Mysql_delete_query_builder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: Mysql_delete_query_builder<T>) => void): this;
}

declare class Mysql_model_manager<T extends Model> extends Abstract_model_manager<T> {
    protected mysqlConnection: mysql.Connection;
    protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
    /**
     * Constructor for Mysql_model_manager class.
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
    findOneByPrimaryKey(value: string | number | boolean, throwErrorOnNull?: boolean): Promise<T | null>;
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
    query(): Mysql_query_builder<T>;
    /**
     * @description Returns an update query builder.
     */
    update(): Mysql_update_query_builder<T>;
    /**
     * @description Returns a delete query builder.
     */
    deleteQuery(): Mysql_delete_query_builder<T>;
}

declare class Postgres_update_query_builder<T extends Model> extends ModelUpdateQueryBuilder<T> {
    protected sqlConnection: Client;
    protected joinQuery: string;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a Mysql_query_builder instance.
     * @param model - The model class associated with the table.
     * @param table - The name of the table.
     * @param pgClient - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, table: string, pgClient: Client, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    withData(data: Partial<T>, options?: WithDataOptions): Promise<number>;
    join(relationTable: string, primaryColumn: string, foreignColumn: string): Postgres_update_query_builder<T>;
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): Postgres_update_query_builder<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    whereBuilder(cb: (queryBuilder: Postgres_update_query_builder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: Postgres_update_query_builder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: Postgres_update_query_builder<T>) => void): this;
}

declare class Postgres_delete_query_builder<T extends Model> extends ModelDeleteQueryBuilder<T> {
    protected sqlConnection: Client;
    protected joinQuery: string;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected deleteTemplate: ReturnType<typeof deleteTemplate>;
    protected isNestedCondition: boolean;
    /**
     * @description Constructs a Mysql_query_builder instance.
     * @param model - The model class associated with the table.
     * @param table - The name of the table.
     * @param pgClient - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, table: string, pgClient: Client, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource);
    delete(options?: DeleteOptions): Promise<number>;
    softDelete(options?: SoftDeleteOptions<T>): Promise<number>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): Postgres_delete_query_builder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): Postgres_delete_query_builder<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    whereBuilder(cb: (queryBuilder: Postgres_delete_query_builder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: Postgres_delete_query_builder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: Postgres_delete_query_builder<T>) => void): this;
}

declare class Postgres_model_manager<T extends Model> extends Abstract_model_manager<T> {
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
    findOneByPrimaryKey(value: string | number | boolean, throwErrorOnNull?: boolean): Promise<T | null>;
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
    query(): Postgres_query_builder<T>;
    /**
     * @description Returns an update query builder.
     */
    update(): Postgres_update_query_builder<T>;
    /**
     * @description Returns a delete query builder.
     */
    deleteQuery(): Postgres_delete_query_builder<T>;
}

declare class Sql_lite_update_query_builder<T extends Model> extends ModelUpdateQueryBuilder<T> {
    protected sqlConnection: sqlite3.Database;
    protected joinQuery: string;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected isNestedCondition: boolean;
    protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
    /**
     * @description Constructs a Mysql_query_builder instance.
     * @param model - The model class associated with the table.
     * @param table - The name of the table.
     * @param sqlLiteCOnnection - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, table: string, sqlLiteConnection: sqlite3.Database, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource, sqlModelManagerUtils: SqlModelManagerUtils<T>);
    /**
     * @description Updates a record in the database.
     * @param data - The data to update.
     * @param trx - The transaction to run the query in.
     * @returns The updated records.
     */
    withData(data: Partial<T>, options?: WithDataOptions): Promise<number>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): Sql_lite_update_query_builder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): Sql_lite_update_query_builder<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    whereBuilder(cb: (queryBuilder: Sql_lite_update_query_builder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: Sql_lite_update_query_builder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: Sql_lite_update_query_builder<T>) => void): this;
    private promisifyQuery;
}

declare class Sql_lite_delete_query_builder<T extends Model> extends ModelDeleteQueryBuilder<T> {
    protected sqlConnection: sqlite3.Database;
    protected joinQuery: string;
    protected updateTemplate: ReturnType<typeof updateTemplate>;
    protected deleteTemplate: ReturnType<typeof deleteTemplate>;
    protected isNestedCondition: boolean;
    protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
    /**
     * @description Constructs a Mysql_query_builder instance.
     * @param model - The model class associated with the table.
     * @param table - The name of the table.
     * @param sqlConnection - The Sqlite connection pool.
     * @param logs - A boolean indicating whether to log queries.
     * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
     */
    constructor(model: typeof Model, table: string, sqlConnection: sqlite3.Database, logs: boolean, isNestedCondition: boolean | undefined, sqlDataSource: SqlDataSource, sqlModelManagerUtils: SqlModelManagerUtils<T>);
    delete(options?: DeleteOptions): Promise<number>;
    softDelete(options?: SoftDeleteOptions<T>): Promise<number>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    join(relationTable: string, primaryColumn: string, foreignColumn: string): Sql_lite_delete_query_builder<T>;
    /**
     *
     * @param relationTable - The name of the related table.
     * @param primaryColumn - The name of the primary column in the caller table.
     * @param foreignColumn - The name of the foreign column in the related table.
     */
    leftJoin(relationTable: string, primaryColumn: string, foreignColumn: string): Sql_lite_delete_query_builder<T>;
    /**
     * @description Build more complex where conditions.
     * @param cb
     */
    whereBuilder(cb: (queryBuilder: Sql_lite_delete_query_builder<T>) => void): this;
    /**
     * @description Build complex OR-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    orWhereBuilder(cb: (queryBuilder: Sql_lite_delete_query_builder<T>) => void): this;
    /**
     * @description Build complex AND-based where conditions.
     * @param cb Callback function that takes a query builder and adds conditions to it.
     */
    andWhereBuilder(cb: (queryBuilder: Sql_lite_delete_query_builder<T>) => void): this;
    private promisifyQuery;
}

declare class Sql_lite_model_manager<T extends Model> extends Abstract_model_manager<T> {
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
    findOneByPrimaryKey(value: string | number | boolean, throwErrorOnNull?: boolean): Promise<T | null>;
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
    query(): Sql_lite_query_builder<T>;
    /**
     * @description Returns an update query builder.
     */
    update(): Sql_lite_update_query_builder<T>;
    /**
     * @description Returns a delete query builder.
     */
    deleteQuery(): Sql_lite_delete_query_builder<T>;
    private promisifyQuery;
}

type DriverSpecificOptions = {
    mysqlOptions?: mysql.PoolOptions;
    pgOptions?: pg.PoolConfig;
};
type ModelManager<T extends Model> = Mysql_model_manager<T> | Postgres_model_manager<T> | Sql_lite_model_manager<T>;
type SqlConnectionType = mysql.Connection | pg.Client | sqlite3.Database;
interface SqlDataSourceInput extends DataSourceInput {
    type: Exclude<DataSourceType, "redis">;
}
type SqlDataSourceType = SqlDataSourceInput["type"];
declare class SqlDataSource extends Datasource {
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
    static getInstance(): SqlDataSource | null;
    /**
     * @description Starts a transaction on the database and returns the transaction object
     * @param model
     * @returns {Promise<Transaction>} trx
     */
    startTransaction(driverSpecificOptions?: DriverSpecificOptions): Promise<Transaction>;
    /**
     * @description Alias for startTransaction
     * @returns {Promise<Transaction>} trx
     */
    beginTransaction(driverSpecificOptions?: DriverSpecificOptions): Promise<Transaction>;
    /**
     * @description Alias for startTransaction
     * @returns {Promise<Transaction>} trx
     */
    transaction(driverSpecificOptions?: DriverSpecificOptions): Promise<Transaction>;
    /**
     * @description Returns model manager for the provided model
     * @param model
     */
    getModelManager<T extends Model>(model: {
        new (): T;
    } | typeof Model): ModelManager<T>;
    /**
     * @description Executes a callback function with the provided connection details
     * @description Static Model methods will always use the base connection created with SqlDataSource.connect() method
     * @param connectionDetails
     * @param cb
     */
    static useConnection(connectionDetails: SqlDataSourceInput, cb: (sqlDataSource: SqlDataSource) => Promise<void>): Promise<void>;
    /**
     * @description Returns the current connection
     * @returns {Promise<SqlConnectionType>} sqlConnection
     */
    getCurrentConnection(): SqlConnectionType;
    /**
     * @description Returns separate raw sql connection
     */
    getRawConnection(driverSpecificOptions?: DriverSpecificOptions): Promise<SqlConnectionType>;
    /**
     * @description Closes the connection to the database
     * @returns
     */
    closeConnection(): Promise<void>;
    /**
     * @description Executes a raw query on the database
     * @param query
     * @param params
     * @returns
     */
    rawQuery(query: string, params?: any[]): Promise<any>;
    /**
     * @description Executes a raw query on the database with the base connection created with SqlDataSource.connect() method
     * @param query
     * @param params
     * @returns
     */
    static rawQuery(query: string, params?: any[]): Promise<any>;
    private connectDriver;
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
declare class Redis_data_source {
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
    static getConnection(input?: RedisOptions): Promise<Redis_data_source>;
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
    Redis: typeof Redis_data_source;
};

export { type CaseConvention, type DataSourceInput, Migration, Model, ModelDeleteQueryBuilder, type ModelQueryBuilder, ModelUpdateQueryBuilder, type PaginatedData, type PaginationMetadata, Redis_data_source as Redis, type RedisGiveable, type RedisStorable, Relation, SqlDataSource, belongsTo, column, _default as default, getModelColumns, getPrimaryKey, getRelations, hasMany, hasOne };
