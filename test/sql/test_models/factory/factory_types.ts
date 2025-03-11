import { Model } from "../../../../src/sql/models/model";

export type FactoryReturnType<T extends number, O extends Model> = T extends 1
  ? Promise<O>
  : Promise<O[]>;
