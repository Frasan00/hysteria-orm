import {
  getModelColumns,
  getPrimaryKey,
} from "../sql/models/decorators/model_decorators";
import { ColumnType } from "../sql/models/decorators/model_decorators_types";
import { Model } from "../sql/models/model";
import { OpenApiModelPropertyType, OpenApiModelType } from "./openapi_types";

/**
 * Detects column type from decorator metadata and serialize/prepare functions in best effort
 */
const detectColumnType = (column: ColumnType): OpenApiModelPropertyType => {
  const baseType: OpenApiModelPropertyType = {
    type: "string",
    description: column.openApiDescription || `Property: ${column.columnName}`,
  };

  if (column.serialize && column.serialize.toString().includes("parseDate")) {
    return {
      ...baseType,
      type: "string",
      format: "date-time",
    };
  }

  if (column.serialize && column.serialize.toString().includes("Boolean(")) {
    return {
      ...baseType,
      type: "boolean",
    };
  }

  if (
    (column.serialize && column.serialize.toString().includes("+value")) ||
    (column.serialize && column.serialize.toString().includes("Number("))
  ) {
    return {
      ...baseType,
      type: "number",
    };
  }

  if (column.serialize && column.serialize.toString().includes("JSON.parse")) {
    return {
      ...baseType,
      type: "object",
    };
  }

  if (column.prepare && column.prepare.toString().includes("randomUUID")) {
    return {
      ...baseType,
      type: "string",
      format: "uuid",
    };
  }

  if (column.prepare && column.prepare.toString().includes("generateULID")) {
    return {
      ...baseType,
      type: "string",
      format: "ulid",
    };
  }

  return baseType;
};

/**
 * Determines if a column is required based on metadata and TypeScript type
 */
const isColumnRequired = (
  column: ColumnType,
  primaryKey: string | undefined,
  model: typeof Model,
): boolean => {
  if (column.columnName === primaryKey) {
    return true;
  }

  if (column.hidden) {
    return false;
  }

  if (column.autoUpdate) {
    return false;
  }

  if (column.prepare && column.prepare.toString().includes("autoCreate")) {
    return false;
  }

  try {
    const prototype = model.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(
      prototype,
      column.columnName,
    );

    if (descriptor && (descriptor.get || descriptor.set)) {
      return false;
    }
  } catch (error) {}

  return true;
};

/**
 * Generates OpenAPI properties from model columns
 */
const generateColumnProperties = (
  model: typeof Model,
): Record<string, OpenApiModelPropertyType> => {
  const columns = getModelColumns(model);
  const properties: Record<string, OpenApiModelPropertyType> = {};

  for (const column of columns) {
    if (column.hidden) {
      continue;
    }

    properties[column.columnName] = detectColumnType(column);
  }

  return properties;
};

/**
 * Gets required fields based on column metadata and TypeScript types
 */
const getRequiredFields = (model: typeof Model): string[] => {
  const columns = getModelColumns(model);
  const primaryKey = getPrimaryKey(model);
  const required: string[] = [];

  for (const column of columns) {
    if (isColumnRequired(column, primaryKey, model)) {
      required.push(column.columnName);
    }
  }

  return required;
};

/**
 * Generates OpenAPI schema for a model
 */
const generateModelSchema = (model: typeof Model): OpenApiModelType => {
  const properties = generateColumnProperties(model);
  const required = getRequiredFields(model);

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
};

/**
 * Generates OpenAPI schemas for multiple models
 */
export const generateOpenApiModel = <T extends new () => Model>(
  models: T[],
): OpenApiModelType[] => {
  return models.map((model) =>
    generateModelSchema(model as unknown as typeof Model),
  );
};

/**
 * Generates OpenAPI schema for a single model
 */
export const generateOpenApiModelSchema = <T extends new () => Model>(
  model: T,
): OpenApiModelType => {
  return generateModelSchema(model as unknown as typeof Model);
};

/**
 * Generates OpenAPI schemas with additional metadata
 */
export const generateOpenApiModelWithMetadata = <T extends new () => Model>(
  models: T[],
): Array<OpenApiModelType & { modelName: string }> => {
  return models.map((model) => ({
    ...generateModelSchema(model as unknown as typeof Model),
    modelName: model.name,
  }));
};
