import { camelToSnakeCase } from "../../../CaseUtils";

export type WhereOperatorType = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE";
type BaseValues = string | number | boolean | Date;

const whereTemplate = (tableName: string) => {
  return {
    where: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
    ) =>
      `\nWHERE ${tableName}.${camelToSnakeCase(column)} = ${parseValue(
        value,
      )} `,
    andWhere: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
    ) =>
      ` AND ${tableName}.${camelToSnakeCase(column)} = ${parseValue(value)} `,
    orWhere: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
    ) => ` OR ${tableName}.${camelToSnakeCase(column)} = ${parseValue(value)} `,
    whereNot: (column: string, value: BaseValues) =>
      `\nWHERE ${tableName}.${camelToSnakeCase(column)} != ${parseValue(
        value,
      )} `,
    andWhereNot: (column: string, value: BaseValues) =>
      ` AND ${tableName}.${camelToSnakeCase(column)} != ${parseValue(value)} `,
    orWhereNot: (column: string, value: BaseValues) =>
      ` OR ${tableName}.${camelToSnakeCase(column)} != ${parseValue(value)} `,
    whereNull: (column: string) =>
      `\nWHERE ${tableName}.${camelToSnakeCase(column)} IS NULL `,
    andWhereNull: (column: string) =>
      ` AND ${tableName}.${camelToSnakeCase(column)} IS NULL `,
    orWhereNull: (column: string) =>
      ` OR ${tableName}.${camelToSnakeCase(column)} IS NULL `,
    whereNotNull: (column: string) =>
      `\nWHERE ${tableName}.${camelToSnakeCase(column)} IS NOT NULL `,
    andWhereNotNull: (column: string) =>
      ` AND ${tableName}.${camelToSnakeCase(column)} IS NOT NULL `,
    orWhereNotNull: (column: string) =>
      ` OR ${tableName}.${camelToSnakeCase(column)} IS NOT NULL `,
    whereBetween: (column: string, min: BaseValues, max: BaseValues) =>
      `\nWHERE ${tableName}.${camelToSnakeCase(
        column,
      )} BETWEEN ${min} AND ${max} `,
    andWhereBetween: (column: string, min: BaseValues, max: BaseValues) =>
      ` AND ${tableName}.${camelToSnakeCase(
        column,
      )} BETWEEN ${min} AND ${max} `,
    orWhereBetween: (column: string, min: BaseValues, max: BaseValues) =>
      ` OR ${tableName}.${camelToSnakeCase(column)} BETWEEN ${min} AND ${max} `,
    whereNotBetween: (column: string, min: BaseValues, max: BaseValues) =>
      `\nWHERE ${tableName}.${camelToSnakeCase(
        column,
      )} NOT BETWEEN ${min} AND ${max} `,
    andWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) =>
      ` AND ${tableName}.${camelToSnakeCase(
        column,
      )} NOT BETWEEN ${min} AND ${max} `,
    orWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) =>
      ` OR ${tableName}.${camelToSnakeCase(
        column,
      )} NOT BETWEEN ${min} AND ${max} `,
    whereIn: (column: string, values: BaseValues[]) =>
      `\nWHERE ${tableName}.${camelToSnakeCase(column)} IN (${values
        .map((value: BaseValues) => parseValue(value))
        .join(", ")}) `,
    andWhereIn: (column: string, values: BaseValues[]) =>
      ` AND ${tableName}.${camelToSnakeCase(column)} IN (${values
        .map((value: BaseValues) => parseValue(value))
        .join(", ")}) `,
    orWhereIn: (column: string, values: BaseValues[]) =>
      ` OR ${tableName}.${camelToSnakeCase(column)} IN (${values
        .map((value: BaseValues) => parseValue(value))
        .join(", ")}) `,
    whereNotIn: (column: string, values: BaseValues[]) =>
      `\nWHERE ${tableName}.${camelToSnakeCase(column)} NOT IN (${values
        .map((value: BaseValues) => parseValue(value))
        .join(", ")}) `,
    andWhereNotIn: (column: string, values: BaseValues[]) =>
      ` AND ${tableName}.${camelToSnakeCase(column)} NOT IN (${values
        .map((value: BaseValues) => parseValue(value))
        .join(", ")}) `,
    orWhereNotIn: (column: string, values: BaseValues[]) =>
      ` OR ${tableName}.${camelToSnakeCase(column)} NOT IN (${values
        .map((value: BaseValues) => parseValue(value))
        .join(", ")}) `,
    rawWhere: (query: string) => `\nWHERE ${query} `,
    rawAndWhere: (query: string) => ` AND ${query} `,
    rawOrWhere: (query: string) => ` OR ${query} `,
  };
};

export type WhereTemplateType = {
  where: (
    column: string,
    value: BaseValues,
    operator: WhereOperatorType,
  ) => string;
  andWhere: (
    column: string,
    value: BaseValues,
    operator: WhereOperatorType,
  ) => string;
  orWhere: (
    column: string,
    value: BaseValues,
    operator: WhereOperatorType,
  ) => string;
  whereNot: (column: string, value: BaseValues) => string;
  andWhereNot: (column: string, value: BaseValues) => string;
  orWhereNot: (column: string, value: BaseValues) => string;
  whereNull: (column: string) => string;
  andWhereNull: (column: string) => string;
  orWhereNull: (column: string) => string;
  whereNotNull: (column: string) => string;
  andWhereNotNull: (column: string) => string;
  orWhereNotNull: (column: string) => string;
  whereBetween: (column: string, min: BaseValues, max: BaseValues) => string;
  andWhereBetween: (column: string, min: BaseValues, max: BaseValues) => string;
  orWhereBetween: (column: string, min: BaseValues, max: BaseValues) => string;
  whereNotBetween: (column: string, min: BaseValues, max: BaseValues) => string;
  andWhereNotBetween: (
    column: string,
    min: BaseValues,
    max: BaseValues,
  ) => string;
  orWhereNotBetween: (
    column: string,
    min: BaseValues,
    max: BaseValues,
  ) => string;
  whereIn: (column: string, values: BaseValues[]) => string;
  andWhereIn: (column: string, values: BaseValues[]) => string;
  orWhereIn: (column: string, values: BaseValues[]) => string;
  whereNotIn: (column: string, values: BaseValues[]) => string;
  andWhereNotIn: (column: string, values: BaseValues[]) => string;
  orWhereNotIn: (column: string, values: BaseValues[]) => string;
  rawWhere: (query: string) => string;
  rawAndWhere: (query: string) => string;
  rawOrWhere: (query: string) => string;
};

function parseValue(value: BaseValues) {
  if (typeof value === "string") {
    return `'${value}'`;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return `'${value.toISOString()}'`;
}

export default whereTemplate;
