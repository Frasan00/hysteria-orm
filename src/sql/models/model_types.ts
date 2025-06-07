import { SqlDataSource } from "../sql_data_source";
import { Transaction } from "../transactions/transaction";
import { Model } from "./model";
import { ExcludeRelations } from "./model_manager/model_manager_types";

export type ModelDataWithOnlyColumns<T extends Model> = Pick<
  T,
  ExcludeRelations<Omit<T, "*">>
>;

export type NumberModelKey<T extends Model> = {
  [K in keyof T]: T[K] extends number | bigint ? K : never;
}[keyof T];

export type BaseModelMethodOptions = {
  useConnection?: SqlDataSource;
  trx?: Transaction;
  ignoreHooks?: boolean;
};
