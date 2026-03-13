import {
  AnyModelConstructor,
  SqlDataSourceModel,
  SqlDataSourceType,
} from "../..";
import { CaseConvention } from "../../utils/case_utils";
import { SqlDataSource } from "../sql_data_source";
import { ReplicationType } from "../sql_data_source_types";
import { Transaction } from "../transactions/transaction";
import { Model } from "./model";
import { ExcludeRelations } from "./model_manager/model_manager_types";
import { ModelQueryBuilder } from "./model_query_builder/model_query_builder";

/**
 * Extracts only non-method keys from a type.
 * Excludes any property that is a function.
 */
export type ExcludeMethods<T> = {
  [K in keyof T]: K extends "__tableName"
    ? never
    : T[K] extends (...args: any[]) => any
      ? never
      : K;
}[keyof T];

/**
 * Picks only non-method properties from the base Model class.
 * This ensures that when selecting specific columns, instance methods
 * like save(), delete(), refresh() are not incorrectly included.
 */
export type ModelDataProperties = Pick<Model, ExcludeMethods<Model>>;

/**
 * Model data without relation properties.
 * Includes only data columns from the model, excluding foreign keys and relation accessors.
 */
export type ModelWithoutRelations<T extends Model> = Pick<
  Omit<T, "*">,
  ExcludeRelations<Omit<T, "*">>
> &
  ModelDataProperties;

/**
 * Return type for Model query/mutation methods.
 * Represents data-only properties without any business logic.
 *
 * This type is used as the return type for:
 * - Static find methods: find, findOne, findOneOrFail, findBy, findOneBy, findOneByPrimaryKey
 * - Static retrieval methods: all, first
 * - Static mutation methods: insert, insertMany, upsert, upsertMany, updateRecord, softDelete, save
 * - Static refresh method: refresh
 *
 * @example
 * ```typescript
 * // Find methods return ModelQueryResult<User> (or arrays/nullables thereof)
 * const user1 = await sql.from(User).findOne({ where: { id: 1 } });
 * const users = await sql.from(User).find({});
 *
 * // Mutation methods return void by default; use returning for data
 * await sql.from(User).insert({ name: "John" }); // void
 * const newUser = await sql.from(User).insert({ name: "John" }, { returning: ["*"] }); // Whole User object
 *
 * if (user1) {
 *   await sql.from(User).updateRecord(user1.id, { name: "Jane" }); // void
 *   const updated = await sql.from(User).updateRecord(user1.id, { name: "Jane" }, { returning: ["*"] }); // Whole User object
 *   const refreshed = await sql.from(User).refresh(user1.id);
 *   await sql.from(User).deleteRecord(user1.id);
 * }
 * ```
 */
export type ModelQueryResult<T extends Model> = ModelWithoutRelations<T>;

export type NumberModelKey<T extends Model> = {
  [K in keyof T]: K extends "__tableName"
    ? never
    : T[K] extends number
      ? K
      : never;
}[keyof T];

export type BaseModelMethodOptions = {
  /**
   * @description The connection to use for the model
   * @example
   * ```ts
   * import { SqlDataSource } from "hysteria-orm";
   * const sql = new SqlDataSource({ type: "postgres", ... });
   * await sql.connect();
   *
   * const users = await sql.from(User).many();
   * ```
   */
  connection?: SqlDataSource;
  /**
   * @description The transaction instance to use for the model
   */
  trx?: Transaction;
  /**
   * @description Whether to ignore the hooks for the model
   */
  ignoreHooks?: boolean;

  /**
   * @description The replication mode to use for the model
   * @description If not specified, read operations will use slave (if available) else master, and write operations will always use master
   * @description If set to "master", all operations will use master
   * @description If set to "slave", read operations will use slave and write operations will use master
   */
  replicationMode?: ReplicationType;
};

/**
 * @description Options that can be provided to a raw sql operation (like the raw QueryBuilder)
 */
export type RawModelOptions = {
  /**
   * Alias for the table
   */
  alias?: string;
  /**
   * @description Convert the column casing before making a Database query, by default preserves what is provided
   */
  databaseCaseConvention?: CaseConvention;
  /**
   * Column to use for soft deleted, by default is `deleted_at`
   */
  softDeleteColumn?: string;
  /**
   * Column to use for soft deleted, by default is date in format: "YYYY-MM-DD HH:mm:ss" in UTC timezone
   */
  softDeleteValue?: string | boolean;
};

/**
 * Maps each model in a SqlDataSource models registry to its corresponding
 * ModelQueryBuilder, allowing `sql.models.users` instead of `sql.from(User)`.
 */
export type ModelsProxy<
  T extends Record<string, SqlDataSourceModel>,
  D extends SqlDataSourceType,
> = {
  readonly [K in keyof T]: T[K] extends AnyModelConstructor
    ? ModelQueryBuilder<
        InstanceType<T[K]>,
        ModelWithoutRelations<InstanceType<T[K]>>,
        {},
        D
      >
    : never;
};
