import { SqlDataSource } from "../sql_data_source";
import { AugmentedSqlDataSource } from "../sql_data_source_types";
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
   * @description The main connection is the one created by the `sql.connect` method
   * @example
   * ```ts
   * import { sql } from "hysteria-orm";
   * const customConnection = await sql.connectToSecondarySource({
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
  connection?: SqlDataSource | AugmentedSqlDataSource;
  /**
   * @description The transaction instance to use for the model
   */
  trx?: Transaction;
  /**
   * @description Whether to ignore the hooks for the model
   */
  ignoreHooks?: boolean;
};
