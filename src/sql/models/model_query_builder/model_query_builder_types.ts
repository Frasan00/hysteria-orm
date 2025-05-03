import { Model } from "../../models/model";

export type ModelInstanceType<O> = O extends typeof Model
  ? InstanceType<O>
  : never;

export type FetchHooks = "beforeFetch" | "afterFetch";

export type OneOptions = {
  ignoreHooks?: FetchHooks[];
};

export type ManyOptions = {
  ignoreHooks?: FetchHooks[];
};
