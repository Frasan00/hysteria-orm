import pluralize from "pluralize";

export const COLUMN_METADATA_KEY = Symbol("columns");
export const PRIMARY_KEY_METADATA_KEY = Symbol("primaryKey");
export const RELATION_METADATA_KEY = Symbol("relations");

export const getDefaultForeignKey = (table: string) => {
  return `${pluralize.singular(table)}_id`;
};
