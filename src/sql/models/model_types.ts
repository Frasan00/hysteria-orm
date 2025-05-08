import { SqlDataSource } from "../sql_data_source";
import { Transaction } from "../transactions/transaction";
import { Model } from "./model";

export type ModelWithoutExtraColumns<T extends Model> = Omit<
  Partial<T>,
  "$annotations"
>;

export type NumberModelKey<T extends Model> = {
  [K in keyof T]: T[K] extends number | bigint ? K : never;
}[keyof T];

export type BaseModelMethodOptions = {
  useConnection?: SqlDataSource;
  trx?: Transaction;
};
