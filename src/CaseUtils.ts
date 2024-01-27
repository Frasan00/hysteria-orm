import { Model } from "./Sql/Models/Model";
import { Relation } from "./Sql/Models/Relations/Relation";

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

export function camelToSnakeCase(camelCase: any) {
  if (typeof camelCase !== "string" || !camelCase) {
    return camelCase;
  }

  return camelCase.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function fromSnakeToCamelCase(snake: any) {
  if (typeof snake !== "string" || !snake) {
    return snake;
  }

  return snake.replace(/(_\w)/g, (x) => x[1].toUpperCase());
}

export function parseDatabaseDataIntoModelResponse<
  T extends Record<string, any>,
>(
  models: T[],
  paginate?: {
    limit: number;
    page: number;
  },
): { paginationMetadata: PaginationMetadata; data: T[] } | T | T[] | null {
  if (!models) {
    return null;
  }

  if (paginate) {
    const offset = (paginate.page - 1) * paginate.limit;
    const paginatedItems = models.slice(offset, offset + paginate.limit);

    const paginationMetadata = {
      perPage: paginate.limit,
      currentPage: paginate.page,
      firstPage: 1,
      isEmpty: paginatedItems.length === 0,
      total: models.length,
      hasTotal: true,
      lastPage: Math.ceil(models.length / paginate.limit),
      hasMorePages: paginate.page < Math.ceil(models.length / paginate.limit),
      hasPages: models.length > paginate.limit,
    };

    return {
      paginationMetadata,
      data: paginatedItems.map((model) => parseModel(model)),
    };
  }

  const parsedModels = models.map((model) => parseModel(model));
  return parsedModels.length === 1 ? parsedModels[0] : parsedModels;
}

function parseModel<T extends Record<string, any>>(model: T): T {
  const camelCaseModel: Record<string, any> = {};

  Object.keys(model).forEach((key) => {
    if (["metadata", "aliasColumns", "setProps"].includes(key)) {
      camelCaseModel[key] = model[key];
      return;
    }

    const originalValue = model[key];
    const camelCaseKey = fromSnakeToCamelCase(key);

    const isObject = typeof originalValue === "object";
    const isNotArray = !Array.isArray(originalValue);
    const isNotRelation = !(originalValue instanceof Relation);
    const isNotDate = !(originalValue instanceof Date);

    if (originalValue && isObject && isNotArray && isNotRelation && isNotDate) {
      camelCaseModel[camelCaseKey] = parseModel(originalValue);
    } else if (isNotRelation && isNotDate) {
      camelCaseModel[camelCaseKey] = originalValue;
    }
  });

  return camelCaseModel as T;
}
