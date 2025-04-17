import { Model } from "../models/model";
import { QueryBuilder } from "./query_builder";

export type CteCallback<T extends Model> = (
  queryBuilder: QueryBuilder<T>,
) => QueryBuilder<T>;

export type CteMap = Map<string, QueryBuilder<any>>;

/**
 * @description The type of CTE to create
 */
export type WithClauseType = "recursive" | "normal";
