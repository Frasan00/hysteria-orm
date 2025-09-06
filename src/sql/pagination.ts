import { Model } from "./models/model";
import { AnnotatedModel } from "./models/model_query_builder/model_query_builder_types";

export type PaginationMetadata = {
  perPage: number;
  currentPage: number;
  firstPage: number;
  isEmpty: boolean;
  total: number;
  lastPage: number;
  hasMorePages: boolean;
  hasPages: boolean;
};

export type CursorPaginationMetadata = {
  perPage: number;
  firstPage: number;
  isEmpty: boolean;
  total: number;
};

export type PaginatedData<
  T extends Model,
  A extends object = {},
  R extends object = {},
> = {
  paginationMetadata: PaginationMetadata;
  data: AnnotatedModel<T, A, R>[];
};

export type CursorPaginatedData<
  T extends Model,
  A extends object = {},
  R extends object = {},
> = {
  paginationMetadata: CursorPaginationMetadata;
  data: AnnotatedModel<T, A, R>[];
};

export function getPaginationMetadata(
  page: number,
  limit: number,
  total: number,
): PaginationMetadata {
  return {
    total: total,
    perPage: limit,
    currentPage: page,
    firstPage: 1,
    isEmpty: total === 0,
    lastPage: Math.max(1, Math.ceil(total / limit)),
    hasMorePages: page < Math.max(1, Math.ceil(total / limit)),
    hasPages: total > limit,
  };
}

export function getCursorPaginationMetadata(
  limit: number,
  total: number,
): CursorPaginationMetadata {
  return {
    perPage: limit,
    total: total,
    firstPage: 1,
    isEmpty: total === 0,
  };
}
