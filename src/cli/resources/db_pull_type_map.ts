import type { TableColumnInfo } from "../../sql/schema_introspection_types";

export interface TypeMappingResult {
  method: string;
  options: Record<string, any>;
  comment?: string;
}

/**
 * Map database column types to col.* methods
 */
export function mapColumnType(
  dialect: string,
  columnInfo: TableColumnInfo,
): TypeMappingResult {
  const {
    dataType,
    isNullable,
    defaultValue,
    length,
    precision,
    scale,
    withTimezone,
    unsigned,
  } = columnInfo;

  const options: Record<string, any> = {};

  // Handle nullable
  if (!isNullable) {
    options.nullable = false;
  }

  // Handle default values (only for literals, not SQL expressions)
  if (defaultValue !== null && defaultValue !== undefined) {
    const defaultStr = String(defaultValue);
    // Skip SQL expressions like now(), CURRENT_TIMESTAMP, etc.
    if (!defaultStr.includes("(") && !defaultStr.includes("CURRENT_")) {
      options.default = defaultValue;
    }
  }

  // Handle length
  if (length !== null && length !== undefined) {
    options.length = length;
  }

  // Handle precision/scale for decimal/numeric
  if (precision !== null && precision !== undefined) {
    options.precision = precision;
  }
  if (scale !== null && scale !== undefined) {
    options.scale = scale;
  }

  // Handle unsigned (MySQL)
  if (unsigned) {
    options.unsigned = true;
  }

  // Map data type to col method
  const normalizedType = dataType.toLowerCase();

  // PostgreSQL timestamp with timezone
  if (normalizedType.includes("timestamp") && withTimezone) {
    options.withTimezone = true;
  }

  // Determine method based on type
  let method = "string";

  if (normalizedType.includes("varchar") || normalizedType.includes("char")) {
    method = "string";
  } else if (normalizedType.includes("text")) {
    method = "text";
  } else if (
    normalizedType === "integer" ||
    normalizedType === "int" ||
    normalizedType === "int4"
  ) {
    method = "integer";
  } else if (normalizedType === "bigint" || normalizedType === "int8") {
    method = "bigInteger";
  } else if (normalizedType === "smallint" || normalizedType === "int2") {
    method = "smallint";
  } else if (normalizedType === "boolean" || normalizedType === "bool") {
    method = "boolean";
  } else if (normalizedType.includes("timestamp")) {
    method = "timestamp";
  } else if (normalizedType === "date") {
    method = "date";
  } else if (normalizedType === "time") {
    method = "time";
  } else if (normalizedType === "uuid") {
    method = "uuid";
  } else if (normalizedType === "json") {
    method = "json";
  } else if (normalizedType === "jsonb") {
    method = "jsonb";
  } else if (normalizedType === "decimal" || normalizedType === "numeric") {
    method = "decimal";
  } else if (normalizedType === "float" || normalizedType === "real") {
    method = "float";
  } else if (
    normalizedType === "double" ||
    normalizedType === "double precision"
  ) {
    method = "float";
  } else if (normalizedType === "binary" || normalizedType === "bytea") {
    method = "binary";
  } else if (normalizedType === "enum") {
    method = "enum";
    if (columnInfo.enumValues) {
      options.enumValues = columnInfo.enumValues;
    }
  }

  // MySQL tinyint(1) as boolean
  if (
    dialect === "mysql" &&
    normalizedType.includes("tinyint") &&
    length === 1
  ) {
    method = "boolean";
  }

  return { method, options };
}
