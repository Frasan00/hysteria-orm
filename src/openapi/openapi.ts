import { ColumnType } from "../sql/models/decorators/model_decorators_types";
import { Model } from "../sql/models/model";
import { OpenApiModelPropertyType, OpenApiModelType } from "./openapi_types";

/**
 * @description Detects column type from decorator metadata and serialize/prepare functions in best effort
 * @description By default it tries to cover the base serialization of the base columns types like column.integer, column.boolean etc.
 */
const detectColumnType = (column: ColumnType): OpenApiModelPropertyType => {
  const { required, ...rest } = column.openApi || {};
  const baseType: OpenApiModelPropertyType = {
    ...rest,
    type: column.openApi?.type || "string",
    description:
      column.openApi?.description ?? `Property: ${column.columnName}`,
  };

  // if an explicit openApi.type was provided, we honor it
  if (column.openApi?.type) {
    return {
      ...baseType,
      type: column.openApi.type,
    };
  }

  // enum (array of allowed string values)
  if (Array.isArray(column.type)) {
    return {
      ...baseType,
      type: "string",
      enum: column.type as string[],
    };
  }

  // dates / times
  if (
    column.type === "date" ||
    column.type === "datetime" ||
    column.type === "timestamp" ||
    column.type === "time"
  ) {
    return {
      ...baseType,
      type: "string",
      format: "date-time",
    };
  }

  // boolean
  if (column.type === "boolean") {
    return {
      ...baseType,
      type: "boolean",
    };
  }

  // integer-like types
  if (
    column.type === "integer" ||
    column.type === "tinyint" ||
    column.type === "smallint" ||
    column.type === "mediumint" ||
    column.type === "increment"
  ) {
    return {
      ...baseType,
      type: "integer",
      format: "int32",
    };
  }

  // big integers
  if (column.type === "biginteger" || column.type === "bigIncrement") {
    return {
      ...baseType,
      type: "integer",
      format: "int64",
    };
  }

  // floating / decimal numbers
  if (column.type === "float" || column.type === "real") {
    return {
      ...baseType,
      type: "number",
      format: "float",
    };
  }

  if (column.type === "double") {
    return {
      ...baseType,
      type: "number",
      format: "double",
    };
  }

  if (column.type === "decimal" || column.type === "numeric") {
    // decimals can be represented as numbers but some APIs prefer strings for precision
    return {
      ...baseType,
      type: "number",
    };
  }

  // JSON
  if (column.type === "json" || column.type === "jsonb") {
    return {
      ...baseType,
      type: "object",
    };
  }

  // UUID / ULID
  if (column.type === "uuid") {
    return {
      ...baseType,
      type: "string",
      format: "uuid",
    };
  }

  if (column.type === "ulid") {
    return {
      ...baseType,
      type: "string",
      format: "ulid",
    };
  }

  // text / string-like
  if (
    column.type === "string" ||
    column.type === "char" ||
    column.type === "varchar" ||
    column.type === "text" ||
    column.type === "longtext" ||
    column.type === "mediumtext" ||
    column.type === "tinytext"
  ) {
    return {
      ...baseType,
      type: "string",
    };
  }

  // binary / blob
  if (
    column.type === "blob" ||
    column.type === "binary" ||
    column.type === "varbinary" ||
    column.type === "tinyblob" ||
    column.type === "mediumblob" ||
    column.type === "longblob"
  ) {
    return {
      ...baseType,
      type: "string",
      format: "binary",
    };
  }

  // year
  if (column.type === "year") {
    return {
      ...baseType,
      type: "integer",
      format: "int32",
    };
  }

  // fallback to baseType
  return baseType;
};

/**
 * Determines if a column is required based on metadata and TypeScript type
 */
const isColumnRequired = (column: ColumnType): boolean => {
  return column.openApi?.required ?? false;
};

/**
 * Generates OpenAPI properties from model columns
 */
const generateColumnProperties = (
  model: typeof Model,
): Record<string, OpenApiModelPropertyType> => {
  const columns = model.getColumns();
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
  const columns = model.getColumns();
  const required: string[] = [];

  for (const column of columns) {
    if (isColumnRequired(column)) {
      required.push(column.columnName);
    }
  }

  return required || [];
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
    required: required.length ? required : [],
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
): Array<OpenApiModelType & { modelName: string; $id?: string }> => {
  return models.map((model) => ({
    ...generateModelSchema(model as unknown as typeof Model),
    modelName: model.name,
    $id: model.name,
  }));
};
