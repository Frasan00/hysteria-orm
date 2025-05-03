import type { Model } from "../../model";
import { ModelQueryBuilder } from "../model_query_builder";

/**
 * @description Due to query limitations some query builder methods may not be available in a RelationQueryBuilder
 */
export type RelationQueryBuilderType<T extends Model> = Omit<
  ModelQueryBuilder<T>,
  | "limit"
  | "offset"
  | "many"
  | "one"
  | "oneOrFail"
  | "insert"
  | "insertMany"
  | "update"
  | "delete"
  | "softDelete"
>;
