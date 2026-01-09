import crypto from "node:crypto";
import { PassThrough } from "node:stream";
import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { JsonPathInput } from "../../../utils/json_path_utils";
import { withPerformance } from "../../../utils/performance";
import { BaseValues, BinaryOperatorType } from "../../ast/query/node/where";
import { InterpreterUtils } from "../../interpreter/interpreter_utils";
import { Model } from "../../models/model";
import type {
  ModelKey,
  ModelRelation,
} from "../../models/model_manager/model_manager_types";
import SqlModelManagerUtils from "../../models/model_manager/model_manager_utils";
import {
  CursorPaginatedData,
  getPaginationMetadata,
  PaginatedData,
} from "../../pagination";
import {
  DeleteOptions,
  SoftDeleteOptions,
} from "../../query_builder/delete_query_builder_type";
import { QueryBuilder } from "../../query_builder/query_builder";
import {
  Cursor,
  PaginateWithCursorOptions,
  RelationRetrieveMethod,
  StreamOptions,
  WriteQueryParam,
} from "../../query_builder/query_builder_types";
import type { UpdateOptions } from "../../query_builder/update_query_builder_types";
import {
  deepCloneNode,
  remapSelectedColumnToFromAlias,
} from "../../resources/utils";
import { serializeModel } from "../../serializer";
import { SqlDataSource } from "../../sql_data_source";
import { execSqlStreaming } from "../../sql_runner/sql_runner";
import { ColumnType } from "../decorators/model_decorators_types";
import { BaseModelMethodOptions, ModelWithoutRelations } from "../model_types";
import { ManyToMany } from "../relations/many_to_many";
import { Relation, RelationEnum } from "../relations/relation";
import type {
  ComposeBuildSelect,
  ComposeSelect,
  FetchHooks,
  ManyOptions,
  OneOptions,
  RelatedInstance,
  SelectableColumn,
  SelectedModel,
} from "./model_query_builder_types";
import type { RelationQueryBuilderType } from "./relation_query_builder/relation_query_builder_types";

export class ModelQueryBuilder<
  T extends Model,
  S extends Record<string, any> = ModelWithoutRelations<T>,
  R extends Record<string, any> = {},
> extends QueryBuilder<T> {
  declare relation: Relation;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
  protected relationQueryBuilders: ModelQueryBuilder<any>[];
  protected modelSelectedColumns: string[];
  private modelColumnsMap: Map<string, ColumnType>;
  private modelColumnsDatabaseNames: Map<string, string>;
  protected limitValue?: number;
  protected offsetValue?: number;

  // @ts-expect-error
  override performance = {
    many: this.manyWithPerformance.bind(this),
    one: this.oneWithPerformance.bind(this),
    oneOrFail: this.oneOrFailWithPerformance.bind(this),
    paginate: this.paginateWithPerformance.bind(this),
    exists: this.existsWithPerformance.bind(this),
    paginateWithCursor: this.paginateWithCursorWithPerformance.bind(this),
    truncate: this.truncateWithPerformance.bind(this),
    delete: this.deleteWithPerformance.bind(this),
    update: this.updateWithPerformance.bind(this),
    softDelete: this.softDeleteWithPerformance.bind(this),
    pluck: this.pluckWithPerformance.bind(this),
  };

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      model,
      this.dbType,
      sqlDataSource,
    );

    this.relationQueryBuilders = [];
    this.modelSelectedColumns = [];
    this.modelColumnsMap = new Map<string, ColumnType>();
    this.modelColumnsDatabaseNames = new Map<string, string>();
    const modelColumns = this.model.getColumns();
    modelColumns.forEach((column) => {
      this.modelColumnsMap.set(column.databaseName, column);
      this.modelColumnsDatabaseNames.set(
        column.databaseName,
        column.columnName,
      );
    });
  }

  /**
   * @description Returns true if the query builder is a relation query builder, this changes the behavior of the query builder like limit, offset, etc.
   * @internal
   */
  protected get isRelationQueryBuilder(): boolean {
    return !!this.relation;
  }

  /**
   * @description Creates a new ModelQueryBuilder instance from a model. Will use the main connection to the database by default.
   */
  static from(
    model: typeof Model,
    options: BaseModelMethodOptions = {},
  ): ModelQueryBuilder<InstanceType<typeof model>> {
    if (options.connection) {
      return new ModelQueryBuilder(model, options.connection as SqlDataSource);
    }

    if (options.trx) {
      return new ModelQueryBuilder(model, options.trx.sql as SqlDataSource);
    }

    return new ModelQueryBuilder(model, model.sqlInstance);
  }

  // @ts-expect-error - Override could return a subset of the model
  override async one(
    options: OneOptions = {},
  ): Promise<SelectedModel<T, S, R> | null> {
    const result = await this.limit(1).many(options);
    if (!result || !result.length) {
      return null;
    }

    return result[0] as SelectedModel<T, S, R>;
  }

  // @ts-expect-error - Override could return a subset of the model
  override async oneOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<SelectedModel<T, S, R>> {
    const model = await this.one(options);
    if (!model) {
      throw new HysteriaError(this.model.name + "::oneOrFail", "ROW_NOT_FOUND");
    }

    return model as SelectedModel<T, S, R>;
  }

  // @ts-expect-error - Override could return a subset of the model
  override async many(
    options: ManyOptions = {},
  ): Promise<SelectedModel<T, S, R>[]> {
    !(options.ignoreHooks as string[])?.includes("beforeFetch") &&
      (await this.model.beforeFetch?.(this as any));
    const rows = await super.many();
    const models = rows.map((row) => {
      return this.addAdditionalColumnsToModel(row, this.model);
    });

    if (!models.length) {
      return [];
    }

    const serializedModels = await serializeModel(
      models as T[],
      this.model,
      this.modelSelectedColumns,
    );

    if (!serializedModels) {
      return [];
    }

    const serializedModelsArray = Array.isArray(serializedModels)
      ? serializedModels
      : [serializedModels];

    if (!(options.ignoreHooks as string[])?.includes("afterFetch")) {
      await this.model.afterFetch?.(serializedModelsArray);
    }

    if (this.relationQueryBuilders.length) {
      await this.processRelationsRecursively(serializedModelsArray);
    }

    return serializedModelsArray as unknown as SelectedModel<T, S, R>[];
  }

  // @ts-expect-error - Override could return a subset of the model
  override async *chunk(
    chunkSize: number,
    options: ManyOptions = {},
  ): AsyncGenerator<SelectedModel<T, S, R>[] | T[]> {
    let offset = 0;

    while (true) {
      const models = await this.limit(chunkSize).offset(offset).many(options);
      if (!models.length) {
        break;
      }

      yield models;
      offset += models.length;
    }
  }

  // @ts-expect-error - Override with more specific return type for type-safety
  override async stream(
    options: ManyOptions & StreamOptions = {},
  ): Promise<PassThrough & AsyncGenerator<SelectedModel<T, S, R> | T>> {
    !(options.ignoreHooks as string[])?.includes("beforeFetch") &&
      (await this.model.beforeFetch?.(this as any));

    const { sql, bindings } = this.unWrap();
    const dataSource = await this.getSqlDataSource("read");
    const stream = await execSqlStreaming(sql, bindings, dataSource, options, {
      onData: async (passThrough, row) => {
        const model = this.addAdditionalColumnsToModel(row, this.model);
        const serializedModel = await serializeModel(
          [model] as T[],
          this.model,
          this.modelSelectedColumns,
        );

        if (!serializedModel) {
          return;
        }

        if (!(options.ignoreHooks as string[])?.includes("afterFetch")) {
          await this.model.afterFetch?.([serializedModel] as unknown as T[]);
        }

        if (this.relationQueryBuilders.length) {
          await this.processRelationsRecursively([serializedModel as T]);
        }

        passThrough.write(serializedModel);
      },
    });

    return stream as PassThrough & AsyncGenerator<SelectedModel<T, S, R> | T>;
  }

  override async paginateWithCursor<K extends ModelKey<T>>(
    page: number,
    options?: PaginateWithCursorOptions<T, K>,
    cursor?: Cursor<T, K>,
  ): Promise<[CursorPaginatedData<T, S, R>, Cursor<T, K>]> {
    if (!options) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          this.model.name + "::paginateWithCursor",
          "PRIMARY_KEY_NOT_FOUND",
        );
      }

      options = {
        discriminator: this.model.primaryKey as K,
      };
    }

    return super.paginateWithCursor(page, options, cursor) as Promise<
      [CursorPaginatedData<T, S, R>, Cursor<T, K>]
    >;
  }

  /**
   * @description Inserts a new record into the database, it is not advised to use this method directly from the query builder if using a ModelQueryBuilder (`Model.query()`), use the `Model.insert` method instead.
   */
  // @ts-expect-error
  override async insert(
    ...args: Parameters<typeof this.model.insert<T>>
  ): ReturnType<typeof this.model.insert> {
    return (this.model as any).insert(...args);
  }

  /**
   * @description Inserts multiple records into the database, it is not advised to use this method directly from the query builder if using a ModelQueryBuilder (`Model.query()`), use the `Model.insertMany` method instead.
   */
  // @ts-expect-error
  override async insertMany(
    ...args: Parameters<typeof this.model.insertMany<T>>
  ): ReturnType<typeof this.model.insertMany> {
    return (this.model as any).insertMany(...args);
  }

  // @ts-expect-error
  override async update(
    data: Partial<ModelWithoutRelations<T>>,
    options: UpdateOptions = {},
  ): Promise<number> {
    if (!options.ignoreBeforeUpdateHook) {
      await this.model.beforeUpdate?.(this as any);
    }
    return super.update(data as Record<string, WriteQueryParam>);
  }

  override async softDelete(
    options: SoftDeleteOptions<T> = {},
  ): Promise<number> {
    const { ignoreBeforeUpdateHook = false } = options || {};
    !ignoreBeforeUpdateHook && (await this.model.beforeUpdate?.(this as any));
    return super.softDelete(options);
  }

  async delete(options: DeleteOptions = {}): Promise<number> {
    if (!options.ignoreBeforeDeleteHook) {
      await this.model.beforeDelete?.(this as any);
    }
    return super.delete();
  }

  override async getCount(
    column: string = "*",
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.selectRaw(`count(${column}) as total`);
    const ignoredHooks: string[] = options.ignoreHooks ? ["beforeFetch"] : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as { total: number } | null;

    if (!result) {
      return 0;
    }

    return +result.total;
  }

  override async getMax(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.selectRaw(`max(${column}) as total`);
    const ignoredHooks: string[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as { total: number } | null;

    if (!result) {
      return 0;
    }

    return +result.total;
  }

  override async getMin(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.selectRaw(`min(${column}) as total`);
    const ignoredHooks: string[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as { total: number } | null;

    if (!result) {
      return 0;
    }

    return +result.total;
  }

  override async getAvg(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.selectRaw(`avg(${column}) as total`);
    const ignoredHooks: string[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as { total: number } | null;

    if (!result) {
      return 0;
    }

    return +result.total;
  }

  override async getSum(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.selectRaw(`sum(${column}) as total`);
    const ignoredHooks: string[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as { total: number } | null;

    if (!result) {
      return 0;
    }

    return +result.total;
  }

  override async paginate(
    page: number,
    perPage: number,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<PaginatedData<T, S, R>> {
    const clonedQuery = this.clone();
    const paginatedQuery = this.limit(perPage).offset((page - 1) * perPage);
    const hooksToIgnore: ["beforeFetch", "afterFetch"] | [] =
      options.ignoreHooks ? ["beforeFetch", "afterFetch"] : [];

    const [models, total] = await this.executePaginateQueries(
      () => paginatedQuery.many({ ignoreHooks: hooksToIgnore }),
      () => clonedQuery.getCount("*", { ignoreHooks: options.ignoreHooks }),
    );

    const paginationMetadata = getPaginationMetadata(page, perPage, total);

    return {
      paginationMetadata,
      data: models as PaginatedData<T, S, R>["data"],
    };
  }

  /**
   * @description Adds columns to the SELECT clause with full type safety.
   * @description Supports formats: "column", "table.column", "column as alias", "*", "table.*"
   * @description When columns are selected, the return type reflects only those columns
   * @warning This only allows selecting columns that are part of the model. For other columns, use `selectRaw`.
   * @example
   * ```ts
   * // Select specific columns - return type is { id: number, name: string }
   * const users = await User.query().select("id", "name").many();
   *
   * // Select with alias - return type includes the alias
   * const users = await User.query().select("id as userId").many();
   *
   * // Select all - return type is the full model
   * const users = await User.query().select("*").many();
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override select<Columns extends readonly SelectableColumn<T>[]>(
    ...columns: Columns
  ): ModelQueryBuilder<
    T,
    ComposeBuildSelect<
      S,
      T,
      Columns extends readonly string[] ? Columns : readonly string[]
    >,
    R
  > {
    super.select(...(columns as unknown as string[]));

    return this as unknown as ModelQueryBuilder<
      T,
      ComposeBuildSelect<
        S,
        T,
        Columns extends readonly string[] ? Columns : readonly string[]
      >,
      R
    >;
  }

  /**
   * @description Adds a raw SELECT statement with type-safe return type.
   * @description Use the generic parameter to specify the type of the selected columns.
   * @example
   * ```ts
   * // Select raw with type - return type includes the typed columns
   * const users = await User.query()
   *   .selectRaw<{ count: number }>("count(*) as count")
   *   .many();
   * // users[0].count is typed as number
   *
   * // Can be chained with other selects
   * const users = await User.query()
   *   .select("id")
   *   .selectRaw<{ total: number }>("sum(amount) as total")
   *   .many();
   * // users[0] is { id: number, total: number }
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectRaw<Added extends Record<string, any> = Record<string, any>>(
    statement: string,
  ): ModelQueryBuilder<T, ComposeSelect<S, Added>, R> {
    super.selectRaw(statement);
    return this as unknown as ModelQueryBuilder<T, ComposeSelect<S, Added>, R>;
  }

  /**
   * @description Selects a subquery with a typed alias
   * @param cbOrQueryBuilder A callback that receives a QueryBuilder or a QueryBuilder instance
   * @param alias The alias for the subquery result
   * @description Subquery must return a single column
   * @example
   * ```ts
   * const users = await User.query()
   *   .select("id")
   *   .selectSubQuery<number, "postCount">((subQuery) => {
   *     subQuery
   *       .select("COUNT(*)")
   *       .from("posts")
   *       .whereColumn("posts.user_id", "users.id");
   *   }, "postCount")
   *   .many();
   * // users[0].postCount is typed as number
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectSubQuery<ValueType = any, Alias extends string = string>(
    cbOrQueryBuilder: ((subQuery: QueryBuilder<T>) => void) | QueryBuilder<any>,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: ValueType }>, R> {
    super.selectSubQuery(cbOrQueryBuilder, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: ValueType }>,
      R
    >;
  }

  /**
   * @description Clears the SELECT clause and resets to default model type
   * @example
   * ```ts
   * const users = await User.query()
   *   .select("id")
   *   .clearSelect() // Resets to selecting all model columns
   *   .many();
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override clearSelect(): ModelQueryBuilder<T, ModelWithoutRelations<T>, R> {
    this.modelSelectedColumns = [];
    this.selectNodes = [];
    return this as unknown as ModelQueryBuilder<T, ModelWithoutRelations<T>, R>;
  }

  /**
   * @description Selects a JSON value at the specified path and returns it as JSON
   * @param column The column containing JSON data
   * @param path The JSON path to extract (standardized format: "$.user.name", "user.name", or ["user", "name"])
   * @param alias The alias for the selected value
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @description Result is available as a direct property on the model with the alias name
   * @example
   * ```ts
   * // All these path formats are supported:
   *
   * // 1. With $ prefix (standard JSON path)
   * await User.query().selectJson("data", "$.user.name", "userName").one();
   *
   * // 2. Without $ prefix ($ is optional)
   * await User.query().selectJson("data", "user.name", "userName").one();
   *
   * // 3. Array format
   * await User.query().selectJson("data", ["user", "name"], "userName").one();
   *
   * // 4. Array indices with dot notation
   * await User.query().selectJson("data", "items.0.name", "firstItemName").one();
   *
   * // 5. Array indices with array format
   * await User.query().selectJson("data", ["items", 0, "name"], "firstItemName").one();
   *
   * // 6. Root object
   * await User.query().selectJson("data", "$", "allData").one();
   *
   * // Access the result directly on the model
   * const user = await User.query().selectJson<string, "userName">("data", "user.name", "userName").one();
   * console.log(user?.userName); // Typed as string
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJson<ValueType = any, Alias extends string = string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: ValueType }>, R> {
    super.selectJson(column as any, path, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: ValueType }>,
      R
    >;
  }

  /**
   * @description Selects a JSON value at the specified path and returns it as text
   * @param column The column containing JSON data
   * @param path The JSON path to extract (standardized format)
   * @param alias The alias for the selected value
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @description Result is available as a direct property on the model with the alias name
   * @example
   * ```ts
   * // All these path formats are supported:
   *
   * // 1. With $ prefix
   * await User.query().selectJsonText("data", "$.user.email", "userEmail").one();
   *
   * // 2. Without $ prefix
   * await User.query().selectJsonText("data", "user.email", "userEmail").one();
   *
   * // 3. Array format
   * await User.query().selectJsonText("data", ["user", "email"], "userEmail").one();
   *
   * // 4. Array indices
   * await User.query().selectJsonText("data", "tags.0", "firstTag").one();
   * await User.query().selectJsonText("data", ["tags", 0], "firstTag").one();
   *
   * // 5. Deep nesting
   * await User.query().selectJsonText("data", "user.profile.bio", "biography").one();
   *
   * // Access the result directly on the model
   * const user = await User.query().selectJsonText<string, "userEmail">("data", "user.email", "userEmail").one();
   * console.log(user?.userEmail); // Typed as string
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJsonText<ValueType = string, Alias extends string = string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: ValueType }>, R> {
    super.selectJsonText(column as any, path, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: ValueType }>,
      R
    >;
  }

  /**
   * @description Selects the length of a JSON array
   * @param column The column containing JSON array data
   * @param path The JSON path to the array (standardized format, use "$" or "" for root)
   * @param alias The alias for the length value
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @description Result is available as a direct property on the model with the alias name
   * @warning Not supported in SQLite
   * @example
   * ```ts
   * // All these path formats are supported:
   *
   * // 1. With $ prefix
   * await User.query().selectJsonArrayLength("data", "$.items", "itemCount").one();
   *
   * // 2. Without $ prefix
   * await User.query().selectJsonArrayLength("data", "items", "itemCount").one();
   *
   * // 3. Array format
   * await User.query().selectJsonArrayLength("data", ["items"], "itemCount").one();
   *
   * // 4. Root array (use "$" or "")
   * await User.query().selectJsonArrayLength("data", "$", "totalCount").one();
   * await User.query().selectJsonArrayLength("data", "", "totalCount").one();
   *
   * // 5. Nested arrays
   * await User.query().selectJsonArrayLength("data", "user.roles", "roleCount").one();
   * await User.query().selectJsonArrayLength("data", ["user", "roles"], "roleCount").one();
   *
   * // 6. Deeply nested arrays
   * await User.query().selectJsonArrayLength("data", "level1.level2.items", "deepCount").one();
   *
   * // Access the result directly on the model
   * const user = await User.query().selectJsonArrayLength<number, "count">("data", "items", "count").one();
   * console.log(user?.count); // Typed as number
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJsonArrayLength<
    ValueType = number,
    Alias extends string = string,
  >(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: ValueType }>, R> {
    super.selectJsonArrayLength(column as any, path, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: ValueType }>,
      R
    >;
  }

  /**
   * @description Selects the keys of a JSON object
   * @param column The column containing JSON object data
   * @param path The JSON path to the object (standardized format, use "$" or "" for root)
   * @param alias The alias for the keys
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @description Result is available as a direct property on the model with the alias name
   * @warning Not supported in SQLite or MSSQL
   * @postgresql Returns a native array of keys
   * @mysql Returns a JSON array of keys
   * @example
   * ```ts
   * // All these path formats are supported:
   *
   * // 1. With $ prefix
   * await User.query().selectJsonKeys("data", "$.settings", "settingKeys").one();
   *
   * // 2. Without $ prefix
   * await User.query().selectJsonKeys("data", "settings", "settingKeys").one();
   *
   * // 3. Array format
   * await User.query().selectJsonKeys("data", ["settings"], "settingKeys").one();
   *
   * // 4. Root object (use "$" or "")
   * await User.query().selectJsonKeys("data", "$", "rootKeys").one();
   * await User.query().selectJsonKeys("data", "", "rootKeys").one();
   *
   * // 5. Nested objects
   * await User.query().selectJsonKeys("data", "user.profile", "profileKeys").one();
   * await User.query().selectJsonKeys("data", ["user", "profile"], "profileKeys").one();
   *
   * // 6. Deeply nested objects
   * await User.query().selectJsonKeys("data", "settings.display.theme", "themeKeys").one();
   *
   * // Access the result directly on the model
   * const user = await User.query().selectJsonKeys<string[], "keys">("data", "settings", "keys").one();
   * console.log(user?.keys); // Typed as string[] - ["theme", "fontSize", "autoSave"]
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJsonKeys<ValueType = string[], Alias extends string = string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: ValueType }>, R> {
    super.selectJsonKeys(column as any, path, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: ValueType }>,
      R
    >;
  }

  /**
   * @description Adds a raw JSON select expression for database-specific operations
   * @param raw The raw SQL expression (database-specific syntax)
   * @param alias The alias for the selected value
   * @description Result is available as a direct property on the model with the alias name
   * @description Use this for advanced JSON operations not covered by other selectJson* methods
   * @warning This bypasses path standardization - you must write database-specific SQL
   * @example
   * ```ts
   * // PostgreSQL - Extract as text with ->> operator
   * await User.query().selectJsonRaw("data->>'email'", "userEmail").one();
   *
   * // PostgreSQL - Extract nested JSON with -> operator
   * await User.query().selectJsonRaw("data->'user'->'profile'->>'name'", "profileName").one();
   *
   * // PostgreSQL - Array element access
   * await User.query().selectJsonRaw("data->'items'->0->>'name'", "firstName").one();
   *
   * // MySQL - Extract value with json_extract and ->>
   * await User.query().selectJsonRaw("data->>'$.email'", "userEmail").one();
   *
   * // MySQL - Array length with json_length
   * await User.query().selectJsonRaw("json_length(data, '$.items')", "itemCount").one();
   *
   * // MSSQL - Extract value with json_value
   * await User.query().selectJsonRaw("json_value(data, '$.email')", "userEmail").one();
   *
   * // SQLite - Extract value with json_extract
   * await User.query().selectJsonRaw("json_extract(data, '$.email')", "userEmail").one();
   *
   * // Access the result directly on the model
   * const user = await User.query().selectJsonRaw<string, "userEmail">("data->>'email'", "userEmail").one();
   * console.log(user?.userEmail); // Typed as string
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJsonRaw<ValueType = any, Alias extends string = string>(
    raw: string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: ValueType }>, R> {
    super.selectJsonRaw(raw, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: ValueType }>,
      R
    >;
  }

  /**
   * @description Selects COUNT(column) with a typed alias
   * @param column The column to count (use "*" for COUNT(*), supports "table.column" format)
   * @param alias The alias for the count result
   * @example
   * ```ts
   * // Count all rows
   * const result = await User.query().selectCount("*", "totalUsers").one();
   * console.log(result?.totalUsers); // Typed as number
   *
   * // Count specific column
   * const result = await User.query().selectCount("id", "userCount").one();
   *
   * // With table prefix
   * const result = await User.query().selectCount("users.id", "total").one();
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectCount<Alias extends string>(
    column: ModelKey<T> | "*" | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectCount(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects SUM(column) with a typed alias
   * @param column The column to sum (supports "table.column" format)
   * @param alias The alias for the sum result
   * @example
   * ```ts
   * const result = await Order.query().selectSum("amount", "totalAmount").one();
   * console.log(result?.totalAmount); // Typed as number
   *
   * // With table prefix
   * const result = await Order.query().selectSum("orders.amount", "total").one();
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectSum<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectSum(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects AVG(column) with a typed alias
   * @param column The column to average (supports "table.column" format)
   * @param alias The alias for the average result
   * @example
   * ```ts
   * const result = await User.query().selectAvg("age", "averageAge").one();
   * console.log(result?.averageAge); // Typed as number
   *
   * // With table prefix
   * const result = await User.query().selectAvg("users.age", "avgAge").one();
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectAvg<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectAvg(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects MIN(column) with a typed alias
   * @param column The column to get minimum value (supports "table.column" format)
   * @param alias The alias for the min result
   * @example
   * ```ts
   * const result = await User.query().selectMin("age", "youngestAge").one();
   * console.log(result?.youngestAge); // Typed as number
   *
   * // With table prefix
   * const result = await User.query().selectMin("users.age", "minAge").one();
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectMin<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectMin(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects MAX(column) with a typed alias
   * @param column The column to get maximum value (supports "table.column" format)
   * @param alias The alias for the max result
   * @example
   * ```ts
   * const result = await User.query().selectMax("age", "oldestAge").one();
   * console.log(result?.oldestAge); // Typed as number
   *
   * // With table prefix
   * const result = await User.query().selectMax("users.age", "maxAge").one();
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectMax<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectMax(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects COUNT(DISTINCT column) with a typed alias
   * @param column The column to count distinct values (supports "table.column" format)
   * @param alias The alias for the count result
   * @example
   * ```ts
   * const result = await User.query().selectCountDistinct("email", "uniqueEmails").one();
   * console.log(result?.uniqueEmails); // Typed as number
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectCountDistinct<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectCountDistinct(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects UPPER(column) with a typed alias
   * @param column The column to convert to uppercase
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await User.query().selectUpper("name", "upperName").one();
   * console.log(result?.upperName); // Typed as string
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectUpper<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: string }>, R> {
    super.selectUpper(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: string }>,
      R
    >;
  }

  /**
   * @description Selects LOWER(column) with a typed alias
   * @param column The column to convert to lowercase
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await User.query().selectLower("name", "lowerName").one();
   * console.log(result?.lowerName); // Typed as string
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectLower<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: string }>, R> {
    super.selectLower(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: string }>,
      R
    >;
  }

  /**
   * @description Selects LENGTH(column) with a typed alias
   * @param column The column to get length of
   * @param alias The alias for the result
   * @note MSSQL uses LEN() instead of LENGTH(), handled automatically
   * @example
   * ```ts
   * const result = await User.query().selectLength("name", "nameLength").one();
   * console.log(result?.nameLength); // Typed as number
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectLength<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectLength(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects TRIM(column) with a typed alias
   * @param column The column to trim whitespace from
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await User.query().selectTrim("name", "trimmedName").one();
   * console.log(result?.trimmedName); // Typed as string
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectTrim<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: string }>, R> {
    super.selectTrim(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: string }>,
      R
    >;
  }

  /**
   * @description Selects ABS(column) with a typed alias
   * @param column The column to get absolute value of
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await Order.query().selectAbs("balance", "absoluteBalance").one();
   * console.log(result?.absoluteBalance); // Typed as number
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectAbs<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectAbs(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects ROUND(column, decimals) with a typed alias
   * @param column The column to round
   * @param decimals Number of decimal places
   * @param alias The alias for the result
   * @postgres Not fully supported - ROUND with precision requires NUMERIC type, not REAL/FLOAT
   * @cockroachdb Not fully supported - ROUND with precision requires NUMERIC type, not REAL/FLOAT
   * @example
   * ```ts
   * const result = await Order.query().selectRound("price", 2, "roundedPrice").one();
   * console.log(result?.roundedPrice); // Typed as number
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectRound<Alias extends string>(
    column: ModelKey<T> | string,
    decimals: number,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectRound(column as string, decimals, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects COALESCE(column, defaultValue) with a typed alias
   * @param column The column to check for NULL
   * @param defaultValue The value to use if column is NULL
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await User.query().selectCoalesce("nickname", "'Unknown'", "displayName").one();
   * console.log(result?.displayName); // Typed as any (depends on column type)
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectCoalesce<Alias extends string>(
    column: ModelKey<T> | string,
    defaultValue: string | number,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: any }>, R> {
    super.selectCoalesce(column as string, defaultValue, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: any }>,
      R
    >;
  }

  /**
   * @description Selects CEIL(column) with a typed alias (rounds up to nearest integer)
   * @param column The column to round up
   * @param alias The alias for the result
   * @sqlite Not supported - SQLite does not have a native CEIL function
   * @mssql Uses CEILING instead of CEIL (handled automatically)
   * @example
   * ```ts
   * const result = await Order.query().selectCeil("price", "ceilPrice").one();
   * console.log(result?.ceilPrice); // Typed as number
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectCeil<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectCeil(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects FLOOR(column) with a typed alias (rounds down to nearest integer)
   * @param column The column to round down
   * @param alias The alias for the result
   * @sqlite Not supported - SQLite does not have a native FLOOR function
   * @example
   * ```ts
   * const result = await Order.query().selectFloor("price", "floorPrice").one();
   * console.log(result?.floorPrice); // Typed as number
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectFloor<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectFloor(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Selects SQRT(column) with a typed alias (square root)
   * @param column The column to get square root of
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await Data.query().selectSqrt("value", "sqrtValue").one();
   * console.log(result?.sqrtValue); // Typed as number
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectSqrt<Alias extends string>(
    column: ModelKey<T> | string,
    alias: Alias,
  ): ModelQueryBuilder<T, ComposeSelect<S, { [K in Alias]: number }>, R> {
    super.selectSqrt(column as string, alias);
    return this as unknown as ModelQueryBuilder<
      T,
      ComposeSelect<S, { [K in Alias]: number }>,
      R
    >;
  }

  /**
   * @description Fills the relations in the model in the serialized response. Relation must be defined in the model.
   * @warning Many to many relations have special behavior, since they require a join, a join clause will always be added to the query.
   * @warning Many to many relations uses the model foreign key for mapping, this property will be removed from the model after the relation is filled.
   * @warning Foreign keys should always be selected in the relation query builder, otherwise the relation will not be filled.
   * @mssql HasMany relations with limit/offset and orderByRaw may fail with "Ambiguous column name" error - use fully qualified column names (e.g., `table.column`) in orderByRaw
   * @cockroachdb HasMany relations with limit/offset and orderByRaw may fail with "Ambiguous column name" error - use fully qualified column names (e.g., `table.column`) in orderByRaw
   */
  load<
    RelationKey extends ModelRelation<T>,
    IS extends Record<string, any> = ModelWithoutRelations<
      RelatedInstance<T, RelationKey>
    >,
    IR extends Record<string, any> = {},
  >(
    relation: RelationKey,
    cb: (
      queryBuilder: RelationQueryBuilderType<
        RelatedInstance<T, RelationKey>,
        ModelWithoutRelations<RelatedInstance<T, RelationKey>>,
        {}
      >,
    ) => RelationQueryBuilderType<RelatedInstance<T, RelationKey>, IS, IR>,
  ): ModelQueryBuilder<
    T,
    S,
    R & {
      [K in RelationKey]: Awaited<
        ReturnType<
          ModelQueryBuilder<
            RelatedInstance<T, K>,
            IS,
            IR
          >[RelationRetrieveMethod<T[K]>]
        >
      >;
    }
  >;
  load<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: RelationQueryBuilderType<
        RelatedInstance<T, RelationKey>,
        ModelWithoutRelations<RelatedInstance<T, RelationKey>>,
        {}
      >,
    ) => void,
  ): ModelQueryBuilder<
    T,
    S,
    R & {
      [K in RelationKey]: Awaited<
        ReturnType<
          ModelQueryBuilder<
            RelatedInstance<T, K>,
            ModelWithoutRelations<RelatedInstance<T, K>>,
            {}
          >[RelationRetrieveMethod<T[K]>]
        >
      >;
    }
  >;
  load<
    RelationKey extends ModelRelation<T>,
    IS extends Record<string, any> = ModelWithoutRelations<
      RelatedInstance<T, RelationKey>
    >,
    IR extends Record<string, any> = {},
  >(
    relation: RelationKey,
    cb?: (
      queryBuilder: RelationQueryBuilderType<
        RelatedInstance<T, RelationKey>,
        ModelWithoutRelations<RelatedInstance<T, RelationKey>>,
        {}
      >,
    ) => RelationQueryBuilderType<
      RelatedInstance<T, RelationKey>,
      IS,
      IR
    > | void,
  ): ModelQueryBuilder<
    T,
    S,
    R & {
      [K in RelationKey]: Awaited<
        ReturnType<
          ModelQueryBuilder<
            RelatedInstance<T, K>,
            IS,
            IR
          >[RelationRetrieveMethod<T[K]>]
        >
      >;
    }
  > {
    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);

    const relationQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);

    relationQueryBuilder.relation = modelRelation;
    cb?.(
      relationQueryBuilder as unknown as RelationQueryBuilderType<
        RelatedInstance<T, RelationKey>,
        ModelWithoutRelations<RelatedInstance<T, RelationKey>>,
        {}
      >,
    );
    this.relationQueryBuilders.push(relationQueryBuilder);

    return this as unknown as ModelQueryBuilder<
      T,
      S,
      R & {
        [K in RelationKey]: Awaited<
          ReturnType<
            ModelQueryBuilder<
              RelatedInstance<T, K>,
              IS,
              IR
            >[RelationRetrieveMethod<T[K]>]
          >
        >;
      }
    >;
  }

  /**
   * @description Clears the relations from the query builder
   */
  clearRelations(): this {
    this.relationQueryBuilders = [];
    return this;
  }

  // #region Relation filters

  /**
   * @description Checks if the relation exists in the models and has the given filters, if no callback is provided, it only check if there is at least one record for the relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  havingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  havingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  havingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    return this.andHavingRelated(
      relation,
      cbOrOperatorOrValue as any,
      maybeValue,
    );
  }

  /**
   * @description Checks if the relation exists in the models and has the given filters, if no callback is provided, it only check if there is at least one record for the relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  andHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  andHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  andHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    let actualValue: BaseValues | undefined;
    let actualOperator: BinaryOperatorType | undefined;
    let cb:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | undefined;

    if (typeof cbOrOperatorOrValue === "function") {
      cb = cbOrOperatorOrValue as (
        queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
      ) => void;
    } else if (
      typeof cbOrOperatorOrValue === "string" &&
      maybeValue !== undefined
    ) {
      actualOperator = cbOrOperatorOrValue as BinaryOperatorType;
      actualValue = maybeValue;
    } else if (cbOrOperatorOrValue !== undefined) {
      actualValue = cbOrOperatorOrValue as BaseValues;
      actualOperator = "=";
    }

    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);
    const modelQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);
    modelQueryBuilder.relation = modelRelation;

    const relationQueryBuilder = this.getRelatedModelsQueryForRelation(
      modelQueryBuilder,
      modelRelation,
      [],
    );

    // We clear where in order to apply having relation filter, since we're passing an empty array, by default will be a false condition so we need to clear it
    relationQueryBuilder.clearWhere();
    relationQueryBuilder.clearSelect();
    relationQueryBuilder.selectRaw("1");

    cb?.(
      relationQueryBuilder as unknown as ModelQueryBuilder<
        RelatedInstance<T, RelationKey>
      >,
    );

    this.applyHavingRelatedFilter(
      relationQueryBuilder,
      modelRelation,
      actualOperator,
      actualValue,
    );

    this.whereExists(
      relationQueryBuilder as unknown as (
        queryBuilder: QueryBuilder<T>,
      ) => void | QueryBuilder<T>,
    );

    return this;
  }

  /**
   * @description Checks if the relation exists in the models and has the given filters, if no callback is provided, it only check if there is at least one record for the relation,
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  orHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  orHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  orHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    let actualValue: BaseValues | undefined;
    let actualOperator: BinaryOperatorType | undefined;
    let cb:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | undefined;

    if (typeof cbOrOperatorOrValue === "function") {
      cb = cbOrOperatorOrValue as (
        queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
      ) => void;
    } else if (
      typeof cbOrOperatorOrValue === "string" &&
      maybeValue !== undefined
    ) {
      actualOperator = cbOrOperatorOrValue as BinaryOperatorType;
      actualValue = maybeValue;
    } else if (cbOrOperatorOrValue !== undefined) {
      actualValue = cbOrOperatorOrValue as BaseValues;
      actualOperator = "=";
    }

    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);
    const modelQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);
    modelQueryBuilder.relation = modelRelation;

    const relationQueryBuilder = this.getRelatedModelsQueryForRelation(
      modelQueryBuilder,
      modelRelation,
      [],
    );

    // We clear where in order to apply having relation filter, since we're passing an empty array, by default will be a false condition so we need to clear it
    relationQueryBuilder.clearWhere();
    relationQueryBuilder.clearSelect();
    relationQueryBuilder.selectRaw("1");

    cb?.(
      relationQueryBuilder as unknown as ModelQueryBuilder<
        RelatedInstance<T, RelationKey>
      >,
    );

    this.applyHavingRelatedFilter(
      relationQueryBuilder,
      modelRelation,
      actualOperator,
      actualValue,
    );

    this.orWhereExists(
      relationQueryBuilder as unknown as (
        queryBuilder: QueryBuilder<T>,
      ) => void | QueryBuilder<T>,
    );

    return this;
  }

  /**
   * @description Checks if the relation does not exist in the models and has the given filters, if no callback is provided, it only check if there is no record for the Relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  notHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  notHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  notHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    return this.andNotHavingRelated(
      relation,
      cbOrOperatorOrValue as any,
      maybeValue,
    );
  }

  /**
   * @description Checks if the relation does not exist in the models and has the given filters, if no callback is provided, it only check if there is no record for the relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  andNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  andNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  andNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    let actualValue: BaseValues | undefined;
    let actualOperator: BinaryOperatorType | undefined;
    let cb:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | undefined;

    if (typeof cbOrOperatorOrValue === "function") {
      cb = cbOrOperatorOrValue as (
        queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
      ) => void;
    } else if (
      typeof cbOrOperatorOrValue === "string" &&
      maybeValue !== undefined
    ) {
      actualOperator = cbOrOperatorOrValue as BinaryOperatorType;
      actualValue = maybeValue;
    } else if (cbOrOperatorOrValue !== undefined) {
      actualValue = cbOrOperatorOrValue as BaseValues;
      actualOperator = "=";
    }

    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);
    const modelQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);
    modelQueryBuilder.relation = modelRelation;

    const relationQueryBuilder = this.getRelatedModelsQueryForRelation(
      modelQueryBuilder,
      modelRelation,
      [],
    );

    // We clear where in order to apply having relation filter, since we're passing an empty array, by default will be a false condition so we need to clear it
    relationQueryBuilder.clearWhere();
    relationQueryBuilder.clearSelect();
    relationQueryBuilder.selectRaw("1");

    cb?.(
      relationQueryBuilder as unknown as ModelQueryBuilder<
        RelatedInstance<T, RelationKey>
      >,
    );

    this.applyHavingRelatedFilter(
      relationQueryBuilder,
      modelRelation,
      actualOperator,
      actualValue,
    );

    this.whereNotExists(
      relationQueryBuilder as unknown as (
        queryBuilder: QueryBuilder<T>,
      ) => void | QueryBuilder<T>,
    );

    return this;
  }

  /**
   * @description Checks if the relation does not exist in the models and has the given filters, if no callback is provided, it only check if there is no record for the Relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  orNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  orNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  orNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    let actualValue: BaseValues | undefined;
    let actualOperator: BinaryOperatorType | undefined;
    let cb:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | undefined;

    if (typeof cbOrOperatorOrValue === "function") {
      cb = cbOrOperatorOrValue as (
        queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
      ) => void;
    } else if (
      typeof cbOrOperatorOrValue === "string" &&
      maybeValue !== undefined
    ) {
      actualOperator = cbOrOperatorOrValue as BinaryOperatorType;
      actualValue = maybeValue;
    } else if (cbOrOperatorOrValue !== undefined) {
      actualValue = cbOrOperatorOrValue as BaseValues;
      actualOperator = "=";
    }

    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);
    const modelQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);
    modelQueryBuilder.relation = modelRelation;

    const relationQueryBuilder = this.getRelatedModelsQueryForRelation(
      modelQueryBuilder,
      modelRelation,
      [],
    );

    // We clear where in order to apply having relation filter, since we're passing an empty array, by default will be a false condition so we need to clear it
    relationQueryBuilder.clearWhere();
    relationQueryBuilder.clearSelect();
    relationQueryBuilder.selectRaw("1");

    cb?.(
      relationQueryBuilder as unknown as ModelQueryBuilder<
        RelatedInstance<T, RelationKey>
      >,
    );

    this.applyHavingRelatedFilter(
      relationQueryBuilder,
      modelRelation,
      actualOperator,
      actualValue,
    );

    this.orWhereNotExists(
      relationQueryBuilder as unknown as (
        queryBuilder: QueryBuilder<T>,
      ) => void | QueryBuilder<T>,
    );

    return this;
  }

  // #endregion

  /**
   * @description Returns a copy of the query builder instance.
   */
  override clone(): this {
    const queryBuilder = super.clone();
    queryBuilder.relationQueryBuilders = deepCloneNode(
      this.relationQueryBuilders,
    );
    return queryBuilder;
  }

  /**
   * @description Recursively processes all relations, including nested ones
   */
  protected async processRelationsRecursively(models: T[]): Promise<void> {
    await Promise.all(
      this.relationQueryBuilders
        .filter(
          (relationQueryBuilder) => relationQueryBuilder.isRelationQueryBuilder,
        )
        .map(async (relationQueryBuilder) => {
          const relatedModels = await this.getRelatedModelsForRelation(
            relationQueryBuilder,
            relationQueryBuilder.relation,
            models,
          );

          this.mapRelatedModelsToModels(
            relationQueryBuilder.relation,
            models,
            relatedModels,
          );
        }),
    );
  }

  protected mapRelatedModelsToModels<
    R extends SelectedModel<T, ModelWithoutRelations<T>, Record<string, any>>,
  >(
    relation: Relation,
    modelsToFillWithRelations: T[],
    relatedModels: R[],
  ): void {
    switch (relation.type) {
      case RelationEnum.hasOne:
        if (!this.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::mapRelatedModelsToModels::hasOne",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const relatedModelsMap = new Map<string, R>();

        relatedModels.forEach((relatedModel) => {
          const foreignKeyValue = relatedModel[relation.foreignKey as keyof R];
          if (foreignKeyValue) {
            relatedModelsMap.set(String(foreignKeyValue), relatedModel);
          }
        });

        modelsToFillWithRelations.forEach((modelToFillWithRelation) => {
          const primaryKeyValue =
            modelToFillWithRelation[this.model.primaryKey as keyof T];
          if (!primaryKeyValue) {
            modelToFillWithRelation[relation.columnName as keyof T] =
              null as T[keyof T];
            return;
          }

          const relatedModel = relatedModelsMap.get(String(primaryKeyValue));
          modelToFillWithRelation[relation.columnName as keyof T] =
            (relatedModel || null) as T[keyof T];
        });

        break;
      case RelationEnum.belongsTo:
        const relatedModelsByKey = new Map<string, R>();

        relatedModels.forEach((relatedModel) => {
          if (!relation.model.primaryKey) {
            throw new HysteriaError(
              this.model.name + "::mapRelatedModelsToModels::belongsTo",
              `RELATED_MODEL_DOES_NOT_HAVE_A_PRIMARY_KEY_${relation.model.name}` as const,
            );
          }

          const primaryKeyValue =
            relatedModel[relation.model.primaryKey as keyof R];
          if (primaryKeyValue) {
            relatedModelsByKey.set(String(primaryKeyValue), relatedModel);
          }
        });

        modelsToFillWithRelations.forEach((modelToFillWithRelation) => {
          const foreignKeyValue =
            modelToFillWithRelation[relation.foreignKey as keyof T];
          if (!foreignKeyValue) {
            modelToFillWithRelation[relation.columnName as keyof T] =
              null as T[keyof T];
            return;
          }

          const relatedModel = relatedModelsByKey.get(String(foreignKeyValue));
          modelToFillWithRelation[relation.columnName as keyof T] =
            (relatedModel || null) as T[keyof T];
        });

        break;
      case RelationEnum.hasMany:
        if (!this.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::mapRelatedModelsToModels::hasMany",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const relatedModelsGroupedByForeignKey = new Map<string, R[]>();

        relatedModels.forEach((relatedModel) => {
          const foreignKeyValue = relatedModel[relation.foreignKey as keyof R];
          if (!foreignKeyValue) return;

          const foreignKeyStr = String(foreignKeyValue);
          if (!relatedModelsGroupedByForeignKey.has(foreignKeyStr)) {
            relatedModelsGroupedByForeignKey.set(foreignKeyStr, []);
          }

          relatedModelsGroupedByForeignKey
            .get(foreignKeyStr)!
            .push(relatedModel);
        });

        modelsToFillWithRelations.forEach((modelToFillWithRelation) => {
          const primaryKeyValue =
            modelToFillWithRelation[this.model.primaryKey as keyof T];
          if (!primaryKeyValue) {
            modelToFillWithRelation[relation.columnName as keyof T] =
              [] as T[keyof T];
            return;
          }

          const relatedModelsList =
            relatedModelsGroupedByForeignKey.get(String(primaryKeyValue)) || [];
          modelToFillWithRelation[relation.columnName as keyof T] =
            relatedModelsList as T[keyof T];
        });

        break;
      case RelationEnum.manyToMany:
        if (!this.model.primaryKey || !relation.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::mapRelatedModelsToModels::manyToMany",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const manyToManyRelation = relation as ManyToMany;
        const relatedModelsMapManyToMany = new Map<string, R[]>();
        const relatedPrimaryKey = manyToManyRelation.leftForeignKey;
        const casedRelatedPrimaryKey =
          this.modelColumnsMap.get(relatedPrimaryKey) ||
          this.modelColumnsDatabaseNames.get(relatedPrimaryKey) ||
          convertCase(relatedPrimaryKey, this.model.modelCaseConvention);

        relatedModels.forEach((relatedModel) => {
          const foreignKeyValue = (relatedModel as any)[casedRelatedPrimaryKey];
          if (foreignKeyValue === undefined || foreignKeyValue === null) {
            return;
          }

          const foreignKeyStr = String(foreignKeyValue);
          if (!relatedModelsMapManyToMany.has(foreignKeyStr)) {
            relatedModelsMapManyToMany.set(foreignKeyStr, []);
          }

          // Remove the internal foreign key used for mapping
          delete (relatedModel as any)[casedRelatedPrimaryKey];

          relatedModelsMapManyToMany.get(foreignKeyStr)!.push(relatedModel);
        });

        modelsToFillWithRelations.forEach((modelToFillWithRelation) => {
          const primaryKeyValue =
            modelToFillWithRelation[this.model.primaryKey as keyof T];
          if (!primaryKeyValue) {
            modelToFillWithRelation[relation.columnName as keyof T] =
              [] as T[keyof T];
            return;
          }

          const relatedModelsList =
            relatedModelsMapManyToMany.get(String(primaryKeyValue)) || [];
          modelToFillWithRelation[relation.columnName as keyof T] =
            relatedModelsList as T[keyof T];
        });

        break;
      default:
        throw new HysteriaError(
          this.model.name + "::mapRelatedModelsToModels",
          "UNSUPPORTED_RELATION_TYPE",
        );
    }
  }

  protected async getRelatedModelsForRelation(
    relationQueryBuilder: ModelQueryBuilder<any>,
    relation: Relation,
    models: T[],
  ): Promise<SelectedModel<T, ModelWithoutRelations<T>, R>[]> {
    return this.getRelatedModelsQueryForRelation(
      relationQueryBuilder,
      relation,
      models,
    ).many();
  }

  protected getRelatedModelsQueryForRelation(
    relationQueryBuilder: ModelQueryBuilder<any>,
    relation: Relation,
    models: T[],
  ): ModelQueryBuilder<any, any, any> {
    const filterValues = this.getFilterValuesFromModelsForRelation(
      relation,
      models,
    );

    switch (relation.type) {
      case RelationEnum.belongsTo:
      case RelationEnum.hasOne:
        return relationQueryBuilder.whereIn(
          relationQueryBuilder.relation.type === RelationEnum.belongsTo
            ? relation.model.primaryKey!
            : (relation.foreignKey as string),
          filterValues,
        );
      case RelationEnum.hasMany:
        const limit = relationQueryBuilder.limitNode?.limit;
        const offset = relationQueryBuilder.offsetNode?.offset;
        if (!limit && !offset) {
          return relationQueryBuilder.whereIn(
            relationQueryBuilder.relation.type === RelationEnum.belongsTo
              ? relation.model.primaryKey!
              : (relation.foreignKey as string),
            filterValues,
          );
        }

        const rn = crypto.randomBytes(6).toString("hex");
        const withTableName = `${relation.model.table}_cte_${rn}`;
        const orderByClause = relationQueryBuilder.orderByNodes
          .map((orderByNode) => {
            if (orderByNode.isRawValue) {
              return orderByNode.column;
            }

            return `${this.interpreterUtils.formatStringColumn(this.dbType, orderByNode.column)} ${orderByNode.direction}`;
          })
          .join(", ") || ["1"];

        relationQueryBuilder.clearLimit();
        relationQueryBuilder.clearOffset();

        const qb = relationQueryBuilder.with(withTableName, (cteQb) =>
          cteQb
            .select(...relationQueryBuilder.modelSelectedColumns)
            .selectRaw(
              `ROW_NUMBER() OVER (PARTITION BY ${this.interpreterUtils.formatStringColumn(this.dbType, relation.foreignKey!)} ORDER BY ${orderByClause}) as rn_${rn}`,
            )
            .whereIn(relation.foreignKey as string, filterValues),
        );

        if (limit) {
          qb.whereRaw(`rn_${rn} <= ${limit + (offset || 0)}`);
        }

        if (offset) {
          qb.whereRaw(`rn_${rn} > ${offset}`);
        }

        const outerSelectedColumnsHasMany =
          relationQueryBuilder.modelSelectedColumns.map((column) =>
            remapSelectedColumnToFromAlias(
              column,
              withTableName,
              relationQueryBuilder.model.table,
            ),
          );

        return qb.select(...outerSelectedColumnsHasMany).from(withTableName);
      case RelationEnum.manyToMany:
        if (!this.model.primaryKey || !relation.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::getRelatedModelsForRelation",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const manyToManyRelation = relation as ManyToMany;
        if (!models.length) {
          return relationQueryBuilder;
        }

        const m2mLimit = relationQueryBuilder.limitNode?.limit;
        const m2mOffset = relationQueryBuilder.offsetNode?.offset;
        const m2mSelectedColumns = relationQueryBuilder.modelSelectedColumns
          .length
          ? relationQueryBuilder.modelSelectedColumns.map((column) =>
              column.includes(".")
                ? column
                : `${relation.model.table}.${column}`,
            )
          : [`${relation.model.table}.*`];

        if (!m2mLimit && !m2mOffset) {
          return relationQueryBuilder
            .select(...m2mSelectedColumns)
            .select(
              `${manyToManyRelation.throughModel}.${manyToManyRelation.leftForeignKey} as ${manyToManyRelation.leftForeignKey}`,
            )
            .leftJoin(
              manyToManyRelation.throughModel,
              `${manyToManyRelation.relatedModel}.${manyToManyRelation.model.primaryKey}`,
              `${manyToManyRelation.throughModel}.${manyToManyRelation.rightForeignKey}`,
            )
            .whereIn(
              `${manyToManyRelation.throughModel}.${manyToManyRelation.leftForeignKey}`,
              filterValues,
            );
        }

        const rnM2m = crypto.randomBytes(6).toString("hex");
        const withTableNameM2m = `${relation.model.table}_cte_${rnM2m}`;
        const orderByClauseM2m = relationQueryBuilder.orderByNodes
          .map((orderByNode) => {
            if (orderByNode.isRawValue) {
              return orderByNode.column;
            }

            const column = orderByNode.column.includes(".")
              ? orderByNode.column
              : `${relation.model.table}.${orderByNode.column}`;
            return `${this.interpreterUtils.formatStringColumn(this.dbType, column)} ${orderByNode.direction}`;
          })
          .join(", ") || ["1"];

        relationQueryBuilder.clearLimit();
        relationQueryBuilder.clearOffset();
        relationQueryBuilder.clearOrderBy();

        const cteLeftForeignKey = `${crypto.randomBytes(6).toString("hex")}_left_foreign_key`;
        const qbM2m = relationQueryBuilder.with(withTableNameM2m, (innerQb) =>
          innerQb
            .select(...m2mSelectedColumns)
            .select(
              `${manyToManyRelation.throughModel}.${manyToManyRelation.leftForeignKey} as ${cteLeftForeignKey}`,
            )
            .selectRaw(
              `ROW_NUMBER() OVER (PARTITION BY ${manyToManyRelation.throughModel}.${this.interpreterUtils.formatStringColumn(this.dbType, manyToManyRelation.leftForeignKey)} ORDER BY ${orderByClauseM2m}) as rn_${rnM2m}`,
            )
            .leftJoin(
              manyToManyRelation.throughModel,
              `${manyToManyRelation.relatedModel}.${manyToManyRelation.model.primaryKey}`,
              `${manyToManyRelation.throughModel}.${manyToManyRelation.rightForeignKey}`,
            )
            .whereIn(
              `${manyToManyRelation.throughModel}.${manyToManyRelation.leftForeignKey}`,
              filterValues,
            ),
        );

        if (m2mLimit) {
          qbM2m.whereRaw(`rn_${rnM2m} <= ${m2mLimit + (m2mOffset || 0)}`);
        }

        if (m2mOffset) {
          qbM2m.whereRaw(`rn_${rnM2m} > ${m2mOffset}`);
        }

        const outerSelectedColumns = m2mSelectedColumns.map((column) =>
          remapSelectedColumnToFromAlias(
            column,
            withTableNameM2m,
            relationQueryBuilder.model.table,
          ),
        );

        return qbM2m
          .select(...outerSelectedColumns)
          .select(
            `${withTableNameM2m}.${cteLeftForeignKey} as ${manyToManyRelation.leftForeignKey}`,
          )
          .from(withTableNameM2m);
      default:
        throw new HysteriaError(
          this.model.name + "::getRelatedModelsForRelation",
          "UNSUPPORTED_RELATION_TYPE",
        );
    }
  }

  protected getFilterValuesFromModelsForRelation(
    relation: Relation,
    models: T[],
  ): any[] {
    switch (relation.type) {
      case RelationEnum.hasMany:
      case RelationEnum.hasOne:
        if (!this.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::getFilterValuesFromModelsForRelation",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        return models.map((model) => model[this.model.primaryKey as keyof T]);
      case RelationEnum.belongsTo:
        return models.map((model) => model[relation.foreignKey as keyof T]);
      case RelationEnum.manyToMany:
        if (!this.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::getFilterValuesFromModelsForRelation",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        return models.map((model) => model[this.model.primaryKey as keyof T]);
      default:
        throw new HysteriaError(
          this.model.name + "::getFilterValuesFromModelsForRelation",
          "UNSUPPORTED_RELATION_TYPE",
        );
    }
  }

  protected applyHavingRelatedFilter(
    relationQueryBuilder: ModelQueryBuilder<any>,
    relation: Relation,
    operator?: BinaryOperatorType,
    value?: BaseValues,
  ): void {
    const relatedInterpreter = new InterpreterUtils(relation.model);
    const outerInterpreter = new InterpreterUtils(this.model);
    const dbType = this.dbType;

    switch (relation.type) {
      case RelationEnum.hasOne:
      case RelationEnum.hasMany: {
        if (!this.model.primaryKey || !relation.foreignKey) {
          throw new HysteriaError(
            this.model.name + "::applyHavingRelatedFilter",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const left = relatedInterpreter.formatStringColumn(
          dbType,
          `${relation.model.table}.${relation.foreignKey}`,
        );

        const right = outerInterpreter.formatStringColumn(
          dbType,
          `${this.model.table}.${this.model.primaryKey}`,
        );

        relationQueryBuilder.whereRaw(`${left} = ${right}`);

        if (operator && typeof value === "number") {
          relationQueryBuilder
            .groupByRaw(left)
            .andHavingRaw(`count(*) ${operator} ${value}`);
        }
        return;
      }
      case RelationEnum.belongsTo: {
        if (!relation.model.primaryKey || !relation.foreignKey) {
          throw new HysteriaError(
            this.model.name + "::applyHavingRelatedFilter",
            `RELATED_MODEL_DOES_NOT_HAVE_A_PRIMARY_KEY_${relation.model.name}` as const,
          );
        }

        const left = relatedInterpreter.formatStringColumn(
          dbType,
          `${relation.model.table}.${relation.model.primaryKey}`,
        );
        const right = outerInterpreter.formatStringColumn(
          dbType,
          `${this.model.table}.${relation.foreignKey}`,
        );

        relationQueryBuilder.whereRaw(`${left} = ${right}`);

        if (operator && typeof value === "number") {
          relationQueryBuilder
            .groupByRaw(left)
            .andHavingRaw(`count(*) ${operator} ${value}`);
        }
        return;
      }
      case RelationEnum.manyToMany: {
        const m2m = relation as ManyToMany;
        if (!this.model.primaryKey || !relation.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::applyHavingRelatedFilter",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const hasThroughJoin = relationQueryBuilder.joinNodes?.some(
          (jn) =>
            !jn.isRawValue &&
            jn.table === m2m.throughModel &&
            jn.type === "left",
        );

        if (!hasThroughJoin) {
          relationQueryBuilder.leftJoin(
            m2m.throughModel,
            `${m2m.relatedModel}.${relation.model.primaryKey}`,
            `${m2m.throughModel}.${m2m.rightForeignKey}`,
          );
        }

        const throughLeft = outerInterpreter.formatStringColumn(
          dbType,
          `${m2m.throughModel}.${m2m.leftForeignKey}`,
        );
        const outerPk = outerInterpreter.formatStringColumn(
          dbType,
          `${this.model.table}.${this.model.primaryKey}`,
        );

        relationQueryBuilder.whereRaw(`${throughLeft} = ${outerPk}`);

        if (operator && typeof value === "number") {
          relationQueryBuilder
            .groupByRaw(throughLeft)
            .andHavingRaw(`count(*) ${operator} ${value}`);
        }
        return;
      }
      default:
        throw new HysteriaError(
          this.model.name + "::applyHavingRelatedFilter",
          "UNSUPPORTED_RELATION_TYPE",
        );
    }
  }

  protected addAdditionalColumnsToModel(
    row: any,
    typeofModel: typeof Model,
  ): Record<string, any> {
    const model: Record<string, any> = {};

    Object.entries(row).forEach(([key, value]) => {
      const isModelColumn = this.modelColumnsDatabaseNames.get(key);

      // If it's a model column, add with the original key (database format)
      if (isModelColumn) {
        model[key] = value;
        return;
      }

      // For non-model columns (aliases, selectRaw, joined columns, etc.)
      // Preserve the key exactly as returned from database (no case conversion)
      // Aliases should remain exactly as the user specified them
      model[key] = value;
    });

    return model;
  }

  // @ts-expect-error
  private async manyWithPerformance(
    options: ManyOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: SelectedModel<T, S, R>[];
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.many.bind(this, options),
      returnType,
    )();

    return { data, time: Number(time) };
  }

  // @ts-expect-error
  private async oneWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: SelectedModel<T, S, R> | null;
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.one.bind(this, options),
      returnType,
    )();

    return { data, time: Number(time) };
  }

  // @ts-expect-error
  private async oneOrFailWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: SelectedModel<T, S, R>;
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.oneOrFail.bind(this, options),
      returnType,
    )();

    return { data, time: Number(time) };
  }

  // @ts-expect-error
  private async firstOrFailWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: SelectedModel<T, S, R>;
    time: number;
  }> {
    return this.oneOrFailWithPerformance(options, returnType);
  }

  // @ts-expect-error
  private async paginateWithPerformance(
    page: number,
    perPage: number,
    options?: { ignoreHooks?: boolean },
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: PaginatedData<T, S, R>;
    time: number;
  }> {
    const { ignoreHooks = false } = options || {};
    const [time, data] = await withPerformance(
      this.paginate.bind(this, page, perPage, { ignoreHooks }),
      returnType,
    )();

    return {
      data: {
        paginationMetadata: data.paginationMetadata,
        data: data.data,
      },
      time: Number(time),
    };
  }

  private async paginateWithCursorWithPerformance(
    page: number,
    options: PaginateWithCursorOptions<T, ModelKey<T>>,
    cursor?: Cursor<T, ModelKey<T>>,
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: [CursorPaginatedData<T, S, R>, Cursor<T, ModelKey<T>>];
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.paginateWithCursor.bind(this, page, options, cursor),
      returnType,
    )();

    return {
      data: data as [CursorPaginatedData<T, S, R>, Cursor<T, ModelKey<T>>],
      time: Number(time),
    };
  }

  private async existsWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, data] = await withPerformance(
      this.exists.bind(this),
      returnType,
    )();

    return {
      data,
      time: Number(time),
    };
  }

  private async pluckWithPerformance(
    key: ModelKey<T>,
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, data] = await withPerformance(
      this.pluck.bind(this, key),
      returnType,
    )();

    return {
      data,
      time: Number(time),
    };
  }

  private async softDeleteWithPerformance(
    options: Omit<SoftDeleteOptions<T>, "ignoreBeforeDeleteHook"> = {},
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, data] = await withPerformance(
      this.softDelete.bind(this, options),
      returnType,
    )();

    return {
      data,
      time: Number(time),
    };
  }

  // @ts-expect-error
  private async updateWithPerformance(
    data: Partial<ModelWithoutRelations<T>>,
    options: UpdateOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, result] = await withPerformance(
      this.update.bind(this, data, options),
      returnType,
    )();

    return {
      data: result,
      time: Number(time),
    };
  }

  private async deleteWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, result] = await withPerformance(
      this.delete.bind(this),
      returnType,
    )();

    return {
      data: result,
      time: Number(time),
    };
  }

  private async truncateWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, result] = await withPerformance(
      this.truncate.bind(this),
      returnType,
    )();

    return {
      data: result,
      time: Number(time),
    };
  }
}
