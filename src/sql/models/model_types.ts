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
  useConnection?: SqlDataSource | AugmentedSqlDataSource;
  trx?: Transaction;
  ignoreHooks?: boolean;
};
