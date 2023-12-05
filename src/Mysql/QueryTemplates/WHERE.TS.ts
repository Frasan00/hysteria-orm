import { WhereOperatorType } from "../Models/QueryBuilder/QueryBuilderTypes";

const whereTemplate = (tableName: string) => {
  return {
    where: (column: string, value: string, operator: WhereOperatorType = "=") =>
      `\nWHERE ${tableName}.${column} = ${value} `,
    andWhere: (
      column: string,
      value: string,
      operator: WhereOperatorType = "=",
    ) => ` AND ${tableName}.${column} = ${value} `,
    orWhere: (
      column: string,
      value: string,
      operator: WhereOperatorType = "=",
    ) => ` OR ${tableName}.${column} = ${value} `,
    whereNot: (column: string, value: string) =>
      `\nWHERE ${tableName}.${column} != ${value} `,
    andWhereNot: (column: string, value: string) =>
      ` AND ${tableName}.${column} != ${value} `,
    orWhereNot: (column: string, value: string) =>
      ` OR ${tableName}.${column} != ${value} `,
    whereNull: (column: string) => `\nWHERE ${tableName}.${column} IS NULL `,
    andWhereNull: (column: string) => ` AND ${tableName}.${column} IS NULL `,
    orWhereNull: (column: string) => ` OR ${tableName}.${column} IS NULL `,
    whereNotNull: (column: string) =>
      `\nWHERE ${tableName}.${column} IS NOT NULL `,
    andWhereNotNull: (column: string) =>
      ` AND ${tableName}.${column} IS NOT NULL `,
    orWhereNotNull: (column: string) =>
      ` OR ${tableName}.${column} IS NOT NULL `,
    whereBetween: (column: string, min: string, max: string) =>
      `\nWHERE ${tableName}.${column} BETWEEN ${min} AND ${max} `,
    andWhereBetween: (column: string, min: string, max: string) =>
      ` AND ${tableName}.${column} BETWEEN ${min} AND ${max} `,
    orWhereBetween: (column: string, min: string, max: string) =>
      ` OR ${tableName}.${column} BETWEEN ${min} AND ${max} `,
    whereNotBetween: (column: string, min: string, max: string) =>
      `\nWHERE ${tableName}.${column} NOT BETWEEN ${min} AND ${max} `,
    andWhereNotBetween: (column: string, min: string, max: string) =>
      ` AND ${tableName}.${column} NOT BETWEEN ${min} AND ${max} `,
    orWhereNotBetween: (column: string, min: string, max: string) =>
      ` OR ${tableName}.${column} NOT BETWEEN ${min} AND ${max} `,
    whereIn: (column: string, values: string[]) =>
      `\nWHERE ${tableName}.${column} IN (${values.join(", ")}) `,
    andWhereIn: (column: string, values: string[]) =>
      ` AND ${tableName}.${column} IN (${values.join(", ")}) `,
    orWhereIn: (column: string, values: string[]) =>
      ` OR ${tableName}.${column} IN (${values.join(", ")}) `,
    whereNotIn: (column: string, values: string[]) =>
      `\nWHERE ${tableName}.${column} NOT IN (${values.join(", ")}) `,
    andWhereNotIn: (column: string, values: string[]) =>
      ` AND ${tableName}.${column} NOT IN (${values.join(", ")}) `,
    orWhereNotIn: (column: string, values: string[]) =>
      ` OR ${tableName}.${column} NOT IN (${values.join(", ")}) `,
    rawWhere: (query: string) => `\nWHERE ${query} `,
    rawAndWhere: (query: string) => ` AND ${query} `,
    rawOrWhere: (query: string) => ` OR ${query} `,
  };
};

export type WhereTemplateType = {
  where: (column: string, value: string, operator: WhereOperatorType) => string;
  andWhere: (
    column: string,
    value: string,
    operator: WhereOperatorType,
  ) => string;
  orWhere: (
    column: string,
    value: string,
    operator: WhereOperatorType,
  ) => string;
  whereNot: (column: string, value: string) => string;
  andWhereNot: (column: string, value: string) => string;
  orWhereNot: (column: string, value: string) => string;
  whereNull: (column: string) => string;
  andWhereNull: (column: string) => string;
  orWhereNull: (column: string) => string;
  whereNotNull: (column: string) => string;
  andWhereNotNull: (column: string) => string;
  orWhereNotNull: (column: string) => string;
  whereBetween: (column: string, min: string, max: string) => string;
  andWhereBetween: (column: string, min: string, max: string) => string;
  orWhereBetween: (column: string, min: string, max: string) => string;
  whereNotBetween: (column: string, min: string, max: string) => string;
  andWhereNotBetween: (column: string, min: string, max: string) => string;
  orWhereNotBetween: (column: string, min: string, max: string) => string;
  whereIn: (column: string, values: string[]) => string;
  andWhereIn: (column: string, values: string[]) => string;
  orWhereIn: (column: string, values: string[]) => string;
  whereNotIn: (column: string, values: string[]) => string;
  andWhereNotIn: (column: string, values: string[]) => string;
  orWhereNotIn: (column: string, values: string[]) => string;
  rawWhere: (query: string) => string;
  rawAndWhere: (query: string) => string;
  rawOrWhere: (query: string) => string;
};

export default whereTemplate;
