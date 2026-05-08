import { toPascal, toCamel, toSnake } from "../../utils/case_utils";

/**
 * Simple singularize: strips trailing "s" (or "es" after certain consonants).
 */
function simpleSingularize(word: string): string {
  if (word.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  }
  if (
    word.endsWith("sses") ||
    word.endsWith("shes") ||
    word.endsWith("ches") ||
    word.endsWith("xes") ||
    word.endsWith("zes")
  ) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

// Reserved property names that cannot be used as column names
const RESERVED_MODEL_PROPERTIES = new Set([
  "table",
  "primaryKey",
  "softDeleteColumn",
  "softDeleteValue",
  "modelCaseConvention",
  "databaseCaseConvention",
  "getColumns",
  "getColumnsByName",
  "getColumnsByDatabaseName",
  "getRelations",
  "getIndexes",
  "getUniques",
  "getChecks",
  "beforeFetch",
  "afterFetch",
  "beforeInsert",
  "beforeInsertMany",
  "beforeUpdate",
  "beforeDelete",
  "query",
  "all",
  "first",
  "find",
  "findOneOrFail",
  "findOne",
  "findBy",
  "findOneBy",
  "findOneByPrimaryKey",
  "refresh",
  "sync",
  "insert",
  "insertMany",
  "updateRecord",
  "firstOrInsert",
  "upsert",
  "upsertMany",
  "deleteRecord",
  "save",
  "softDelete",
  "truncate",
  "sqlInstance",
  "getTableInfo",
  "getIndexInfo",
  "getTableSchema",
  "prototype",
  "constructor",
]);

export interface SanitizedName {
  name: string;
  wasSanitized: boolean;
}

/**
 * Generate model name from table name with singularization and case conversion
 */
export function generateModelName(
  tableName: string,
  namingConvention: "camel" | "snake" | "pascal",
): string {
  const singular = simpleSingularize(tableName);

  switch (namingConvention) {
    case "pascal":
      return toPascal(singular);
    case "camel":
      return toCamel(singular);
    case "snake":
      return toSnake(singular);
    default:
      return singular;
  }
}

/**
 * Sanitize column name to avoid conflicts with reserved Model properties
 */
export function sanitizeColumnName(columnName: string): SanitizedName {
  if (RESERVED_MODEL_PROPERTIES.has(columnName)) {
    return { name: `${columnName}_`, wasSanitized: true };
  }
  return { name: columnName, wasSanitized: false };
}

/**
 * Generate file name from model name
 */
export function generateFileName(
  modelName: string,
  namingConvention: "camel" | "snake" | "pascal",
): string {
  switch (namingConvention) {
    case "snake":
      return `${toSnake(modelName)}.ts`;
    case "camel":
      return `${modelName}.ts`;
    case "pascal":
    default:
      return `${modelName}.ts`;
  }
}
