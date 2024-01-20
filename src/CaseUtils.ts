import { Model } from "./Sql/Models/Model";
import { Relation } from "./Sql/Models/Relations/Relation";

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

export function modelFromSnakeCaseToCamel<T extends Record<string, any>>(
  model?: T,
): T | null {
  if (!model) {
    return null;
  }

  const camelCaseModel: Record<string, any> = {};

  if ("metadata" in model) {
    camelCaseModel.metadata = model.metadata;
  }
  if ("aliasColumns" in model) {
    camelCaseModel.aliasColumns = model.aliasColumns;
  }
  if ("setProps" in model) {
    camelCaseModel.setProps = model.setProps;
  }

  Object.keys(model).forEach((key) => {
    if (key === "metadata" || key === "aliasColumns" || key === "setProps") {
      return;
    }

    const originalValue = model[key];
    const camelCaseKey = fromSnakeToCamelCase(key);

    if (
      originalValue &&
      typeof originalValue === "object" &&
      !Array.isArray(originalValue) &&
      !(originalValue instanceof Date)
    ) {
      camelCaseModel[camelCaseKey] = modelFromSnakeCaseToCamel(originalValue);
    } else {
      camelCaseModel[camelCaseKey] = originalValue;
    }
  });

  return camelCaseModel as T;
}
