import { DataSource } from "../data_source/data_source";
import { Model } from "./models/model";

export interface ISqlDataSource<
  TModels extends Record<string, Model> = Record<string, Model>,
> extends DataSource {
  models: TModels;
}
