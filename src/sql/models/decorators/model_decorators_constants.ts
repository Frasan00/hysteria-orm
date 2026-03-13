/**
 * Simple singularize: strips trailing "s" (or "es" after certain consonants).
 * Covers the common ORM case where table names are like "users" → "user",
 * "addresses" → "address", "posts" → "post".
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

export const COLUMN_METADATA_KEY = Symbol("columns");
export const PRIMARY_KEY_METADATA_KEY = Symbol("primaryKey");
export const RELATION_METADATA_KEY = Symbol("relations");
export const INDEX_METADATA_KEY = Symbol("indexes");
export const UNIQUE_METADATA_KEY = Symbol("uniques");
export const CHECK_METADATA_KEY = Symbol("checks");

export const getDefaultForeignKey = (table: string) => {
  return `${simpleSingularize(table)}_id`;
};

export const getDefaultIndexName = (table: string, column: string) => {
  return `idx_${table}_${column}`;
};

export const getDefaultUniqueConstraintName = (
  table: string,
  column: string,
) => {
  return `uq_${table}_${column}`;
};

export const getDefaultFkConstraintName = (
  table: string,
  leftColumn: string,
  rightColumn?: string,
) => {
  return `fk_${table}_${leftColumn}${rightColumn ? `_${rightColumn}` : ""}`;
};

export const getDefaultPrimaryKeyConstraintName = (
  table: string,
  column: string,
) => {
  return `pk_${table}_${column}`;
};

export const getDefaultCheckConstraintName = (
  table: string,
  expression: string,
) => {
  const slug = expression
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  return `chk_${table}_${slug}`.substring(0, 63);
};
