import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { getModelColumns } from "../../models/decorators/model_decorators";
import { Model } from "../../models/model";
import { SqlDataSourceType } from "../../sql_data_source_types";

export type BinaryOperatorType =
  | "="
  | "!="
  | "<>"
  | ">"
  | "<"
  | ">="
  | "<="
  | "like"
  | "not like"
  | "ilike"
  | "not ilike";

export type BaseValues = string | number | boolean | null;

const whereTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const modelColumns = getModelColumns(typeofModel);
  const modelColumnsMap = new Map(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  return {
    where: (
      column: string,
      value: BaseValues,
      operator: BinaryOperatorType = "=",
    ) => {
      const query = `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} ${operator} $PLACEHOLDER`;
      const params = [value];

      return {
        query,
        params,
      };
    },
    andWhere: (
      column: string,
      value: BaseValues,
      operator: BinaryOperatorType = "=",
    ) => {
      const query = ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} ${operator} $PLACEHOLDER`;
      const params = [value];

      return {
        query,
        params,
      };
    },
    orWhere: (
      column: string,
      value: BaseValues,
      operator: BinaryOperatorType = "=",
    ) => {
      const query = ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} ${operator} $PLACEHOLDER`;
      const params = [value];

      return {
        query,
        params,
      };
    },
    whereNot: (column: string, value: BaseValues) => {
      const query = `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} != $PLACEHOLDER`;
      const params = [value];

      return {
        query,
        params,
      };
    },
    andWhereNot: (column: string, value: BaseValues) => {
      const query = ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} != $PLACEHOLDER`;
      const params = [value];

      return {
        query,
        params,
      };
    },
    orWhereNot: (column: string, value: BaseValues) => {
      const query = ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} != $PLACEHOLDER`;
      const params = [value];

      return {
        query,
        params,
      };
    },
    whereBetween: (column: string, min: BaseValues, max: BaseValues) => {
      const query = `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} BETWEEN $PLACEHOLDER AND $PLACEHOLDER`;
      const params = [min, max];

      return {
        query,
        params,
      };
    },
    andWhereBetween: (column: string, min: BaseValues, max: BaseValues) => {
      const query = ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} BETWEEN $PLACEHOLDER AND $PLACEHOLDER`;
      const params = [min, max];

      return {
        query,
        params,
      };
    },
    orWhereBetween: (column: string, min: BaseValues, max: BaseValues) => {
      const query = ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} BETWEEN $PLACEHOLDER AND $PLACEHOLDER`;
      const params = [min, max];

      return {
        query,
        params,
      };
    },
    whereNotBetween: (column: string, min: BaseValues, max: BaseValues) => {
      const query = `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} NOT BETWEEN $PLACEHOLDER AND $PLACEHOLDER`;
      const params = [min, max];

      return {
        query,
        params,
      };
    },
    andWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => {
      const query = ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} NOT BETWEEN $PLACEHOLDER AND $PLACEHOLDER`;
      const params = [min, max];

      return {
        query,
        params,
      };
    },
    orWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => {
      const query = ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} NOT BETWEEN $PLACEHOLDER AND $PLACEHOLDER`;
      const params = [min, max];

      return {
        query,
        params,
      };
    },
    whereIn: (column: string, values: BaseValues[]) => {
      if (!values.length) {
        return {
          query: `\nWHERE 1 = 0`,
          params: [],
        };
      }

      const query = `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} IN (${values.map((_) => "$PLACEHOLDER").join(", ")})`;
      const params = values;

      return {
        query,
        params,
      };
    },
    andWhereIn: (column: string, values: BaseValues[]) => {
      if (!values.length) {
        return {
          query: ` AND 1 = 0`,
          params: [],
        };
      }

      const query = ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} IN (${values.map((_) => "$PLACEHOLDER").join(", ")})`;
      const params = values;

      return {
        query,
        params,
      };
    },
    orWhereIn: (column: string, values: BaseValues[]) => {
      if (!values.length) {
        return {
          query: ` OR 1 = 0`,
          params: [],
        };
      }

      const query = ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} IN (${values.map((_) => "$PLACEHOLDER").join(", ")})`;
      const params = values;

      return {
        query,
        params,
      };
    },
    whereNotIn: (column: string, values: BaseValues[]) => {
      if (!values.length) {
        return {
          query: `\nWHERE 1 = 1`,
          params: [],
        };
      }

      const query = `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} NOT IN (${values.map((_) => "$PLACEHOLDER").join(", ")})`;
      const params = values;

      return {
        query,
        params,
      };
    },
    andWhereNotIn: (column: string, values: BaseValues[]) => {
      if (!values.length) {
        return {
          query: ` AND 1 = 1`,
          params: [],
        };
      }

      const query = ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} NOT IN (${values.map((_) => "$PLACEHOLDER").join(", ")})`;
      const params = values;

      return {
        query,
        params,
      };
    },
    orWhereNotIn: (column: string, values: BaseValues[]) => {
      if (!values.length) {
        return {
          query: ` OR 1 = 1`,
          params: [],
        };
      }

      const query = ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} NOT IN (${values.map((_) => "$PLACEHOLDER").join(", ")})`;
      const params = values;

      return {
        query,
        params,
      };
    },
    whereNull: (column: string) => ({
      query: `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} IS NULL`,
      params: [],
    }),
    andWhereNull: (column: string) => ({
      query: ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} IS NULL`,
      params: [],
    }),
    orWhereNull: (column: string) => ({
      query: ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} IS NULL`,
      params: [],
    }),
    whereNotNull: (column: string) => ({
      query: `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} IS NOT NULL`,
      params: [],
    }),
    andWhereNotNull: (column: string) => ({
      query: ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} IS NOT NULL`,
      params: [],
    }),
    orWhereNotNull: (column: string) => ({
      query: ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} IS NOT NULL`,
      params: [],
    }),
    rawWhere: (
      query: string,
      params: any[],
      operator?: string,
      isSubQuery: boolean = false,
    ) => ({
      query: isSubQuery
        ? `WHERE${operator ? ` ${operator}` : ""} (${query})`
        : `\nWHERE${operator ? ` ${operator}` : ""} ${query}`,
      params,
    }),
    rawAndWhere: (
      query: string,
      params: any[],
      operator?: string,
      isSubQuery: boolean = false,
    ) => ({
      query: isSubQuery
        ? ` AND${operator ? ` ${operator}` : ""} (${query})`
        : ` AND${operator ? ` ${operator}` : ""} ${query}`,
      params,
    }),
    rawOrWhere: (
      query: string,
      params: any[],
      operator?: string,
      isSubQuery: boolean = false,
    ) => ({
      query: isSubQuery
        ? ` OR${operator ? ` ${operator}` : ""} (${query})`
        : ` OR${operator ? ` ${operator}` : ""} ${query}`,
      params,
    }),
    whereSubQuery: (
      column: string,
      query: string,
      params: any[],
      operator: string = "=",
    ) => ({
      query: `\nWHERE ${column} ${operator} (${query})`,
      params,
    }),
    andWhereSubQuery: (
      column: string,
      query: string,
      params: any[],
      operator: string = "=",
    ) => ({
      query: ` AND ${column} ${operator} (${query})`,
      params,
    }),
    orWhereSubQuery: (
      column: string,
      query: string,
      params: any[],
      operator: string = "=",
    ) => ({
      query: ` OR ${column} ${operator} (${query})`,
      params,
    }),
    whereRegex: (column: string, regex: RegExp) => {
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} ~ $PLACEHOLDER`,
            params: [regex.source],
          };
        case "mysql":
        case "mariadb":
          return {
            query: `\nWHERE ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} REGEXP $PLACEHOLDER`,
            params: [regex.source],
          };
        case "sqlite":
          throw new HysteriaError(
            "WhereTemplate::whereRegex",
            "REGEXP_NOT_SUPPORTED_IN_SQLITE",
          );
        default:
          throw new HysteriaError(
            "WhereTemplate::whereRegex",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    andWhereRegex: (column: string, regex: RegExp) => {
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} ~ $PLACEHOLDER`,
            params: [regex.source],
          };
        case "mysql":
        case "mariadb":
          return {
            query: ` AND ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} REGEXP $PLACEHOLDER`,
            params: [regex.source],
          };
        case "sqlite":
          throw new HysteriaError(
            "WhereTemplate::andWhereRegex",
            "REGEXP_NOT_SUPPORTED_IN_SQLITE",
          );
        default:
          throw new HysteriaError(
            "WhereTemplate::andWhereRegex",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    orWhereRegex: (column: string, regex: RegExp) => {
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} ~ $PLACEHOLDER`,
            params: [regex.source],
          };
        case "mysql":
        case "mariadb":
          return {
            query: ` OR ${modelColumnsMap.get(column)?.databaseName ?? convertCase(column, typeofModel.databaseCaseConvention)} REGEXP $PLACEHOLDER`,
            params: [regex.source],
          };
        case "sqlite":
          throw new HysteriaError(
            "WhereTemplate::orWhereRegex",
            "REGEXP_NOT_SUPPORTED_IN_SQLITE",
          );
        default:
          throw new HysteriaError(
            "WhereTemplate::orWhereRegex",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
  };
};

export default whereTemplate;
