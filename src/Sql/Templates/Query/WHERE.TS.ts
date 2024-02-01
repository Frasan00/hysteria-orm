import { camelToSnakeCase } from "../../../CaseUtils";
import * as sqlString from "sqlstring";

export type WhereOperatorType = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "ILIKE";
export type BaseValues = string | number | boolean | Date;

const whereTemplate = (_tableName: string) => {
  return {
    where: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
    ) => `\nWHERE ${camelToSnakeCase(column)} ${operator} ${sqlString.escape(value)}`,
    andWhere: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
    ) => ` AND ${camelToSnakeCase(column)} ${operator} ${sqlString.escape(value)}`,
    orWhere: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
    ) => ` OR ${camelToSnakeCase(column)} ${operator} ${sqlString.escape(value)}`,
    whereNot: (column: string, value: BaseValues) =>
      `\nWHERE ${camelToSnakeCase(column)} != ${sqlString.escape(value)}`,
    andWhereNot: (column: string, value: BaseValues) =>
      ` AND ${camelToSnakeCase(column)} != ${sqlString.escape(value)}`,
    orWhereNot: (column: string, value: BaseValues) =>
      ` OR ${camelToSnakeCase(column)} != ${sqlString.escape(value)}`,
    whereNull: (column: string) =>
      `\nWHERE ${camelToSnakeCase(column)} IS NULL`,
    andWhereNull: (column: string) =>
      ` AND ${camelToSnakeCase(column)} IS NULL`,
    orWhereNull: (column: string) => ` OR ${camelToSnakeCase(column)} IS NULL`,
    whereNotNull: (column: string) =>
      `\nWHERE ${camelToSnakeCase(column)} IS NOT NULL`,
    andWhereNotNull: (column: string) =>
      ` AND ${camelToSnakeCase(column)} IS NOT NULL`,
    orWhereNotNull: (column: string) =>
      ` OR ${camelToSnakeCase(column)} IS NOT NULL`,
    whereBetween: (column: string, min: BaseValues, max: BaseValues) =>
      `\nWHERE (${camelToSnakeCase(column)} BETWEEN ${min} AND ${max})`,
    andWhereBetween: (column: string, min: BaseValues, max: BaseValues) =>
      ` AND (${camelToSnakeCase(column)} BETWEEN ${min} AND ${max})`,
    orWhereBetween: (column: string, min: BaseValues, max: BaseValues) =>
      ` OR (${camelToSnakeCase(column)} BETWEEN ${min} AND ${max})`,
    whereNotBetween: (column: string, min: BaseValues, max: BaseValues) =>
      `\nWHERE (${camelToSnakeCase(column)} NOT BETWEEN ${min} AND ${max})`,
    andWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) =>
      ` AND (${camelToSnakeCase(column)} NOT BETWEEN ${min} AND ${max})`,
    orWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) =>
      ` OR (${camelToSnakeCase(column)} NOT BETWEEN ${min} AND ${max})`,
    whereIn: (column: string, values: BaseValues[]) =>
      `\nWHERE ${camelToSnakeCase(column)} IN (${values
        .map((value: BaseValues) => sqlString.escape(value))
        .join(", ")})`,
    andWhereIn: (column: string, values: BaseValues[]) =>
      ` AND ${camelToSnakeCase(column)} IN (${values
        .map((value: BaseValues) => sqlString.escape(value))
        .join(", ")})`,
    orWhereIn: (column: string, values: BaseValues[]) =>
      ` OR ${camelToSnakeCase(column)} IN (${values
        .map((value: BaseValues) => sqlString.escape(value))
        .join(", ")})`,
    whereNotIn: (column: string, values: BaseValues[]) =>
      `\nWHERE ${camelToSnakeCase(column)} NOT IN (${values
        .map((value: BaseValues) => sqlString.escape(value))
        .join(", ")})`,
    andWhereNotIn: (column: string, values: BaseValues[]) =>
      ` AND ${camelToSnakeCase(column)} NOT IN (${values
        .map((value: BaseValues) => sqlString.escape(value))
        .join(", ")})`,
    orWhereNotIn: (column: string, values: BaseValues[]) =>
      ` OR ${camelToSnakeCase(column)} NOT IN (${values
        .map((value: BaseValues) => sqlString.escape(value))
        .join(", ")})`,
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

export default whereTemplate;
