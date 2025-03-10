import { Model } from "../models/model";

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

export type RelationQueryBuilder = {
  relation: string;
  selectedColumns?: string[];
  whereQuery?: string;
  params?: any[];
  joinQuery?: string;
  groupByQuery?: string;
  orderByQuery?: string;
  limitQuery?: string;
  offsetQuery?: string;
  havingQuery?: string;
  ignoreAfterFetchHook?: boolean;
};
