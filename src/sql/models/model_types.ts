import { CaseConvention } from "../../utils/case_utils";
import { SqlDataSource } from "../sql_data_source";
import { ReplicationType } from "../sql_data_source_types";
import { Transaction } from "../transactions/transaction";
import { Model } from "./model";
import { ExcludeRelations } from "./model_manager/model_manager_types";

export type ModelWithoutRelations<T extends Model> = Pick<
  T,
  ExcludeRelations<Omit<T, "*">>
>;

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
   * const user = await User.query({ connection: customConnection }).first();
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
