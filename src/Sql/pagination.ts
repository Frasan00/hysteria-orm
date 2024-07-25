export type PaginationMetadata = {
  perPage: number;
  currentPage: number;
  firstPage: number;
  isEmpty: boolean;
  total: number;
  hasTotal: boolean;
  lastPage: number;
  hasMorePages: boolean;
  hasPages: boolean;
};

export type PaginatedData<T> = {
  paginationMetadata: PaginationMetadata;
  data: T[];
};

export function getPaginationMetadata(
  page: number,
  limit: number,
  total: number,
) {
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
