import { PickMethods } from "../../utils/types";
import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import { QueryBuilder } from "./query_builder";

export type PluckReturnType<
  T extends Model,
  K extends ModelKey<T>,
> = T[K] extends infer U ? U[] : never;

export type QueryBuilderWithOnlyWhereConditions<T extends Model> = PickMethods<
  QueryBuilder<T>,
  | "where"
  | "andWhere"
  | "orWhere"
  | "whereSubQuery"
  | "andWhereSubQuery"
  | "orWhereSubQuery"
  | "whereBuilder"
  | "andWhereBuilder"
  | "orWhereBuilder"
  | "whereIn"
  | "andWhereIn"
  | "orWhereIn"
  | "whereNotIn"
  | "andWhereNotIn"
  | "orWhereNotIn"
  | "whereNull"
  | "andWhereNull"
  | "orWhereNull"
  | "whereNotNull"
  | "andWhereNotNull"
  | "orWhereNotNull"
  | "whereRegexp"
  | "andWhereRegexp"
  | "orWhereRegexp"
  | "whereBetween"
  | "andWhereBetween"
  | "orWhereBetween"
  | "whereNotBetween"
  | "andWhereNotBetween"
  | "orWhereNotBetween"
  | "whereIn"
  | "andWhereIn"
  | "orWhereIn"
  | "whereNotIn"
  | "andWhereNotIn"
  | "orWhereNotIn"
  | "whereNull"
  | "andWhereNull"
  | "orWhereNull"
  | "whereNotNull"
  | "andWhereNotNull"
  | "orWhereNotNull"
  | "whereRegexp"
  | "andWhereRegexp"
  | "orWhereRegexp"
  | "whereBetween"
  | "andWhereBetween"
  | "orWhereBetween"
  | "whereNotBetween"
  | "andWhereNotBetween"
  | "orWhereNotBetween"
>;

export type RelationRetrieveMethod<P extends any> = P extends any[]
  ? "many"
  : "one";
