import { camelToSnakeCase } from "../../../CaseUtils";
import * as sqlString from "sqlstring";
import { DataSourceType } from "../../../Datasource";

export type WhereOperatorType =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "LIKE"
  | "ILIKE";
export type BaseValues = string | number | boolean | Date;

const whereTemplate = (_tableName: string, dbType: DataSourceType) => {
  return {
    convertPlaceHolderToValue: (query: string) => {
      switch (dbType) {
        case "mysql":
          return query.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
          let index = 1;
          return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new Error("Unsupported database type");
      }
    },
    where: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
      index: number = 0,
    ) => ({
      query: `\nWHERE ${camelToSnakeCase(column)} ${operator} PLACEHOLDER`,
      params: [value],
    }),
    andWhere: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
      index: number = 0,
    ) => ({
      query: ` AND ${camelToSnakeCase(column)} ${operator} PLACEHOLDER`,
      params: [value],
    }),
    orWhere: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
      index: number = 0,
    ) => ({
      query: ` OR ${camelToSnakeCase(column)} ${operator} PLACEHOLDER`,
      params: [value],
    }),
    whereNot: (column: string, value: BaseValues, index: number = 0) => ({
      query: `\nWHERE ${camelToSnakeCase(column)} != PLACEHOLDER`,
      params: [value],
    }),
    andWhereNot: (column: string, value: BaseValues, index: number = 0) => ({
      query: ` AND ${camelToSnakeCase(column)} != PLACEHOLDER`,
      params: [value],
    }),
    orWhereNot: (column: string, value: BaseValues, index: number = 0) => ({
      query: ` OR ${camelToSnakeCase(column)} != PLACEHOLDER`,
      params: [value],
    }),
    whereNull: (column: string) => ({
      query: `\nWHERE ${camelToSnakeCase(column)} IS NULL`,
      params: [],
    }),
    andWhereNull: (column: string) => ({
      query: ` AND ${camelToSnakeCase(column)} IS NULL`,
      params: [],
    }),
    orWhereNull: (column: string) => ({
      query: ` OR ${camelToSnakeCase(column)} IS NULL`,
      params: [],
    }),
    whereNotNull: (column: string) => ({
      query: `\nWHERE ${camelToSnakeCase(column)} IS NOT NULL`,
      params: [],
    }),
    andWhereNotNull: (column: string) => ({
      query: ` AND ${camelToSnakeCase(column)} IS NOT NULL`,
      params: [],
    }),
    orWhereNotNull: (column: string) => ({
      query: ` OR ${camelToSnakeCase(column)} IS NOT NULL`,
      params: [],
    }),
    whereBetween: (column: string, min: BaseValues, max: BaseValues) => ({
      query: `\nWHERE ${camelToSnakeCase(
        column,
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`,
      params: [min, max],
    }),
    andWhereBetween: (column: string, min: BaseValues, max: BaseValues) => ({
      query: ` AND ${camelToSnakeCase(
        column,
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`,
      params: [min, max],
    }),
    orWhereBetween: (column: string, min: BaseValues, max: BaseValues) => ({
      query: ` OR ${camelToSnakeCase(
        column,
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`,
      params: [min, max],
    }),
    whereNotBetween: (column: string, min: BaseValues, max: BaseValues) => ({
      query: `\nWHERE ${camelToSnakeCase(
        column,
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`,
      params: [min, max],
    }),
    andWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => ({
      query: ` AND ${camelToSnakeCase(
        column,
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`,
      params: [min, max],
    }),
    orWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => ({
      query: ` OR ${camelToSnakeCase(
        column,
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`,
      params: [min, max],
    }),
    whereIn: (column: string, values: BaseValues[]) => ({
      query: `\nWHERE ${camelToSnakeCase(column)} IN (${values
        .map((_, index) => "PLACEHOLDER")
        .join(", ")})`,
      params: values,
    }),
    andWhereIn: (column: string, values: BaseValues[]) => ({
      query: ` AND ${camelToSnakeCase(column)} IN (${values
        .map((_, index) => "PLACEHOLDER")
        .join(", ")})`,
      params: values,
    }),
    orWhereIn: (column: string, values: BaseValues[]) => ({
      query: ` OR ${camelToSnakeCase(column)} IN (${values
        .map((_, index) => "PLACEHOLDER")
        .join(", ")})`,
      params: values,
    }),
    whereNotIn: (column: string, values: BaseValues[]) => ({
      query: `\nWHERE ${camelToSnakeCase(column)} NOT IN (${values
        .map((_, index) => "PLACEHOLDER")
        .join(", ")})`,
      params: values,
    }),
    andWhereNotIn: (column: string, values: BaseValues[]) => ({
      query: ` AND ${camelToSnakeCase(column)} NOT IN (${values
        .map((_, index) => "PLACEHOLDER")
        .join(", ")})`,
      params: values,
    }),
    orWhereNotIn: (column: string, values: BaseValues[]) => ({
      query: ` OR ${camelToSnakeCase(column)} NOT IN (${values
        .map((_, index) => "PLACEHOLDER")
        .join(", ")})`,
      params: values,
    }),
    rawWhere: (query: string) => ({
      query: `\nWHERE ${query}`,
      params: [],
    }),
    rawAndWhere: (query: string) => ({
      query: ` AND ${query}`,
      params: [],
    }),
    rawOrWhere: (query: string) => ({
      query: ` OR ${query}`,
      params: [],
    }),
  };
};

export default whereTemplate;
