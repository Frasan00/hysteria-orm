import { Pool, PoolConnection } from 'mysql2/promise';

interface Metadata {
    readonly tableName: string;
    readonly primaryKey?: string;
}
declare abstract class Model {
    metadata: Metadata;
    protected constructor(tableName?: string, primaryKey?: string);
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
    [key: string]: any;
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

type WhereOperatorType = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE";
type WhereTemplateType = {
    where: (column: string, value: string, operator: WhereOperatorType) => string;
    andWhere: (column: string, value: string, operator: WhereOperatorType) => string;
    orWhere: (column: string, value: string, operator: WhereOperatorType) => string;
    whereNot: (column: string, value: string) => string;
    andWhereNot: (column: string, value: string) => string;
    orWhereNot: (column: string, value: string) => string;
    whereNull: (column: string) => string;
    andWhereNull: (column: string) => string;
    orWhereNull: (column: string) => string;
    whereNotNull: (column: string) => string;
    andWhereNotNull: (column: string) => string;
    orWhereNotNull: (column: string) => string;
    whereBetween: (column: string, min: string, max: string) => string;
    andWhereBetween: (column: string, min: string, max: string) => string;
    orWhereBetween: (column: string, min: string, max: string) => string;
    whereNotBetween: (column: string, min: string, max: string) => string;
    andWhereNotBetween: (column: string, min: string, max: string) => string;
    orWhereNotBetween: (column: string, min: string, max: string) => string;
    whereIn: (column: string, values: string[]) => string;
    andWhereIn: (column: string, values: string[]) => string;
    orWhereIn: (column: string, values: string[]) => string;
    whereNotIn: (column: string, values: string[]) => string;
    andWhereNotIn: (column: string, values: string[]) => string;
    orWhereNotIn: (column: string, values: string[]) => string;
    rawWhere: (query: string) => string;
    rawAndWhere: (query: string) => string;
    rawOrWhere: (query: string) => string;
};

declare class QueryBuilder<T extends Model> {
    protected selectQuery: string;
    protected relations: string[];
    protected whereQuery: string;
    protected groupByQuery: string;
    protected orderByQuery: string;
    protected limitQuery: string;
    protected offsetQuery: string;
    protected model: new () => Model;
    protected tableName: string;
    protected mysqlConnection: Pool;
    protected logs: boolean;
    protected selectTemplate: SelectTemplateType;
    protected whereTemplate: WhereTemplateType;
    /**
     * @description Constructs a QueryBuilder instance.
     * @param model - The model class associated with the table.
     * @param tableName - The name of the table.
     * @param mysqlConnection - The MySQL connection pool.
     * @param logs - A boolean indicating whether to log queries.
     */
    constructor(model: new () => Model, tableName: string, mysqlConnection: Pool, logs: boolean);
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
     * @description Columns are customizable with aliases. By default, without this function, all columns are selected
     * @param columns
     */
    select(...columns: string[]): void;
    addRelations(relations: string[]): this;
    /**
     * @description Adds a WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The QueryBuilder instance for chaining.
     */
    where(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): this;
    /**
     * @description Adds an AND WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The QueryBuilder instance for chaining.
     */
    andWhere(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): this;
    /**
     * @description Adds an OR WHERE condition to the query.
     * @param column - The column to filter.
     * @param operator - The comparison operator.
     * @param value - The value to compare against.
     * @returns The QueryBuilder instance for chaining.
     */
    orWhere(column: string, operator: WhereOperatorType, value: string | number | boolean | Date): this;
    /**
     * @description Adds a WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The QueryBuilder instance for chaining.
     */
    whereBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds an AND WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The QueryBuilder instance for chaining.
     */
    andWhereBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds an OR WHERE BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The QueryBuilder instance for chaining.
     */
    orWhereBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds a WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The QueryBuilder instance for chaining.
     */
    whereNotBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds an OR WHERE NOT BETWEEN condition to the query.
     * @param column - The column to filter.
     * @param min - The minimum value for the range.
     * @param max - The maximum value for the range.
     * @returns The QueryBuilder instance for chaining.
     */
    orWhereNotBetween(column: string, min: string, max: string): this;
    /**
     * @description Adds a WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The QueryBuilder instance for chaining.
     */
    whereIn(column: string, values: string[]): this;
    /**
     * @description Adds an AND WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The QueryBuilder instance for chaining.
     */
    andWhereIn(column: string, values: string[]): this;
    /**
     * @description Adds an OR WHERE IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to match against.
     * @returns The QueryBuilder instance for chaining.
     */
    orWhereIn(column: string, values: string[]): this;
    /**
     * @description Adds a WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The QueryBuilder instance for chaining.
     */
    whereNotIn(column: string, values: string[]): this;
    /**
     * @description Adds an OR WHERE NOT IN condition to the query.
     * @param column - The column to filter.
     * @param values - An array of values to exclude.
     * @returns The QueryBuilder instance for chaining.
     */
    orWhereNotIn(column: string, values: string[]): this;
    /**
     * @description Adds a WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The QueryBuilder instance for chaining.
     */
    whereNull(column: string): this;
    /**
     * @description Adds an AND WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The QueryBuilder instance for chaining.
     */
    andWhereNull(column: string): this;
    /**
     * @description Adds an OR WHERE NULL condition to the query.
     * @param column - The column to filter.
     * @returns The QueryBuilder instance for chaining.
     */
    orWhereNull(column: string): this;
    /**
     * @description Adds a WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The QueryBuilder instance for chaining.
     */
    whereNotNull(column: string): this;
    /**
     * @description Adds an AND WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The QueryBuilder instance for chaining.
     */
    andWhereNotNull(column: string): this;
    /**
     * @description Adds an OR WHERE NOT NULL condition to the query.
     * @param column - The column to filter.
     * @returns The QueryBuilder instance for chaining.
     */
    orWhereNotNull(column: string): this;
    /**
     * @description Adds a raw WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The QueryBuilder instance for chaining.
     */
    rawWhere(query: string): this;
    /**
     * @description Adds a raw AND WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The QueryBuilder instance for chaining.
     */
    rawAndWhere(query: string): this;
    /**
     * @description Adds a raw OR WHERE condition to the query.
     * @param query - The raw SQL WHERE condition.
     * @returns The QueryBuilder instance for chaining.
     */
    rawOrWhere(query: string): this;
    /**
     * @description Adds GROUP BY conditions to the query.
     * @param columns - The columns to group by.
     * @returns The QueryBuilder instance for chaining.
     */
    groupBy(...columns: string[]): this;
    /**
     * @description Adds ORDER BY conditions to the query.
     * @param column - The column to order by.
     * @param order - The order direction, either "ASC" or "DESC".
     * @returns The QueryBuilder instance for chaining.
     */
    orderBy(column: string[], order: "ASC" | "DESC"): this;
    /**
     * @description Adds a LIMIT condition to the query.
     * @param limit - The maximum number of rows to return.
     * @returns The QueryBuilder instance for chaining.
     */
    limit(limit: number): this;
    /**
     * @description Adds an OFFSET condition to the query.
     * @param offset - The number of rows to skip.
     * @returns The QueryBuilder instance for chaining.
     */
    offset(offset: number): this;
    protected groupFooterQuery(): string;
}

declare class Transaction {
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

declare class ModelManager<T extends Model> {
    protected logs: boolean;
    protected mysqlPool: Pool;
    protected model: new () => T;
    protected modelInstance: T;
    tableName: string;
    /**
     * Constructor for ModelManager class.
     *
     * @param {new () => T} model - Model constructor.
     * @param {Pool} mysqlConnection - MySQL connection pool.
     * @param {boolean} logs - Flag to enable or disable logging.
     */
    constructor(model: new () => T, mysqlConnection: Pool, logs: boolean);
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
     * @param {Transaction} trx - Transaction to be used on the save operation.
     * @returns Promise resolving to the saved model or null if saving fails.
     */
    save(model: T, trx?: Transaction): Promise<T | null>;
    /**
     * Update an existing model instance in the database.
     * @param {Model} model - Model instance to be updated.
     * @param {Transaction} trx - Transaction to be used on the update operation.
     * @returns Promise resolving to the updated model or null if updating fails.
     */
    update(model: T, trx?: Transaction): Promise<number>;
    /**
     * @description Delete a record from the database from the given column and value.
     *
     * @param {string} column - Column to filter by.
     * @param {string | number | boolean} value - Value to filter by.
     * @param {Transaction} trx - Transaction to be used on the delete operation.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    deleteByColumn(column: string, value: string | number | boolean, trx?: Transaction): Promise<number>;
    /**
     * @description Delete a record from the database from the given model.
     *
     * @param {Model} model - Model to delete.
     * @param {Transaction} trx - Transaction to be used on the delete operation.
     * @returns Promise resolving to the deleted model or null if deleting fails.
     */
    delete(model: T, trx?: Transaction): Promise<number>;
    /**
     * @description Creates a new transaction.
     * @returns {Transaction} - Instance of Transaction.
     */
    createTransaction(): Transaction;
    /**
     * Create and return a new instance of the QueryBuilder for building more complex SQL queries.
     *
     * @returns {QueryBuilder<Model>} - Instance of QueryBuilder.
     */
    queryBuilder(): QueryBuilder<T>;
}

type DatasourceType = "mysql";
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
    abstract getModelManager(model: typeof Model): ModelManager<Model>;
}

type MigrationInput = {
    migrationsPath?: string;
};
declare class MysqlDatasource extends Datasource {
    protected pool: Pool;
    protected connection: PoolConnection;
    protected migrationsPath?: string;
    constructor(input: DatasourceInput & MigrationInput);
    /**
     * @description Connects to the database establishing a connection pool.
     */
    connect(): Promise<void>;
    /**
     * @description Returns raw mysql pool
     */
    getRawPool(): Promise<Pool>;
    /**
     * @description Returns raw mysql PoolConnection
     */
    getRawPoolConnection(): Promise<PoolConnection>;
    /**
     * @description Returns model manager for the provided model
     * @param model
     */
    getModelManager<T extends Model>(model: new () => T): ModelManager<T>;
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

type MigrationType = "create" | "alter" | "rawQuery" | "drop";
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

export { BelongsTo, type DatasourceInput, HasMany, HasOne, Migration, Model, MysqlDatasource };
