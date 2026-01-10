import { CaseConvention } from "../../utils/case_utils";
import { SqlDataSource } from "../sql_data_source";
import { ReplicationType } from "../sql_data_source_types";
import { Transaction } from "../transactions/transaction";
import { Model } from "./model";
import { ExcludeRelations } from "./model_manager/model_manager_types";

/**
 * Extracts only non-method keys from a type.
 * Excludes any property that is a function.
 */
export type ExcludeMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];

/**
 * Picks only non-method properties from the base Model class.
 * This ensures that when selecting specific columns, instance methods
 * like save(), delete(), refresh() are not incorrectly included.
 */
export type ModelDataProperties = Pick<Model, ExcludeMethods<Model>>;

/**
 * Model instance methods available on query results.
 * These methods enable CRUD operations on fetched models.
 *
 * All query results from Model static methods (find, findOne, findOneOrFail,
 * findBy, findOneBy, findOneByPrimaryKey, all, first, insert, insertMany,
 * upsert, upsertMany, updateRecord, softDelete) and from ModelQueryBuilder
 * (one, many, oneOrFail) include these instance methods.
 *
 * @example
 * ```typescript
 * // Using instance methods on query results
 * const user = await User.findOne({ where: { email: "test@example.com" } });
 * if (user) {
 *   user.mergeProps({ name: "Updated Name" });
 *   await user.save();
 *
 *   // Or update directly
 *   await user.update({ name: "Another Name" });
 *
 *   // Refresh from database
 *   await user.refresh();
 *
 *   // Soft delete or hard delete
 *   await user.softDelete();
 *   // or: await user.delete();
 * }
 *
 * // Works with query builder too
 * const user2 = await User.query().where("id", 1).oneOrFail();
 * await user2.update({ status: "inactive" });
 *
 * // Works with select projections
 * const user3 = await User.query().select("id", "name").one();
 * if (user3) {
 *   await user3.delete(); // Still has access to instance methods
 * }
 * ```
 *
 * Note: These signatures are simplified versions that don't carry the
 * `this: T extends Model` constraint, allowing them to work on selected
 * model results without requiring full Model type compatibility.
 */
export type ModelInstanceMethods<T extends Model> = {
  /**
   * Merges the provided data with the model instance.
   * Does not persist to database - use save() or update() after merging.
   */
  mergeProps: (data: Partial<ModelWithoutRelations<T>>) => void;

  /**
   * Saves the model to the database (insert or update based on primary key).
   * @throws {HysteriaError} If the model has no primary key defined
   */
  save: (options?: Omit<BaseModelMethodOptions, "ignoreHooks">) => Promise<any>;

  /**
   * Updates the model in the database with the provided payload.
   * @throws {HysteriaError} If the model has no primary key or primary key value
   */
  update: (
    payload: Partial<ModelWithoutRelations<T>>,
    options?: Omit<BaseModelMethodOptions, "ignoreHooks">,
  ) => Promise<void>;

  /**
   * Soft deletes the model by setting the soft delete column.
   * @throws {HysteriaError} If the model has no primary key or primary key value
   */
  softDelete: (
    softDeleteOptions?: {
      column?: string;
      value?: string | number | boolean | Date;
    },
    options?: Omit<BaseModelMethodOptions, "ignoreHooks">,
  ) => Promise<void>;

  /**
   * Hard deletes the model from the database.
   * @throws {HysteriaError} If the model has no primary key or primary key value
   */
  delete: (
    options?: Omit<BaseModelMethodOptions, "ignoreHooks">,
  ) => Promise<void>;

  /**
   * Refreshes the model from the database, updating all properties with current values.
   * @throws {HysteriaError} If the model has no primary key or primary key value
   */
  refresh: (
    options?: Omit<BaseModelMethodOptions, "ignoreHooks">,
  ) => Promise<any>;
};

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
 * Combines data properties with instance methods for CRUD operations.
 *
 * This type is used as the return type for:
 * - Static find methods: find, findOne, findOneOrFail, findBy, findOneBy, findOneByPrimaryKey
 * - Static retrieval methods: all, first
 * - Static mutation methods: insert, insertMany, upsert, upsertMany, updateRecord, softDelete
 * - Static refresh method: refresh
 *
 * @example
 * ```typescript
 * // All these methods return ModelQueryResult<User> (or arrays/nullables thereof)
 * const user1 = await User.findOne({ where: { id: 1 } });
 * const user2 = await User.findOneOrFail({ where: { id: 1 } });
 * const users = await User.find({});
 * const allUsers = await User.all();
 * const newUser = await User.insert({ name: "John" });
 *
 * // Each result has instance methods available
 * if (user1) {
 *   await user1.update({ name: "Jane" });
 *   await user1.refresh();
 *   await user1.delete();
 * }
 * ```
 */
export type ModelQueryResult<T extends Model> = ModelWithoutRelations<T> &
  ModelInstanceMethods<T>;

export type NumberModelKey<T extends Model> = {
  [K in keyof T]: T[K] extends number | bigint ? K : never;
}[keyof T];

export type BaseModelMethodOptions = {
  /**
   * @description The connection to use for the model, by default the main connection will be used
   * @description The main connection is the one created via `new SqlDataSource().connect()`
   * @example
   * ```ts
   * import { SqlDataSource } from "hysteria-orm";
   * const customConnection = await SqlDataSource.connectToSecondarySource({
   *   type: "postgres",
   *   host: "localhost",
   *   username: "root",
   *   password: "root",
   *   database: "test",
   *   port: 5432,
   * });
   *
   * const user = await User.query({ connection: customConnection }).one();
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
