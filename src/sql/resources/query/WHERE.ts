import { convertCase } from "../../../utils/case_utils";
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
  | "LIKE"
  | "ILIKE"
  | "NOT LIKE"
  | "NOT ILIKE"
  | "IN"
  | "NOT IN"
  | "BETWEEN"
  | "NOT BETWEEN";

export type BaseValues = string | number | boolean | object;

const whereTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  return {
    where: (
      column: string,
      value: BaseValues,
      operator: BinaryOperatorType = "=",
    ) => {
      let query = `\nWHERE ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} ${operator} PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `\nWHERE JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) ${operator} PLACEHOLDER`;
            params = [value];
            break;
          case "postgres":
            query = `\nWHERE ${column}::jsonb ${operator} PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

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
      let query = ` AND ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} ${operator} PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) ${operator} PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column}::jsonb ${operator} PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

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
      let query = ` OR ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} ${operator} PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) ${operator} PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column}::jsonb ${operator} PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    whereNot: (column: string, value: BaseValues) => {
      let query = `\nWHERE ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} != PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `\nWHERE JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) != PLACEHOLDER`;
            break;
          case "postgres":
            query = `\nWHERE ${column}::jsonb != PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    andWhereNot: (column: string, value: BaseValues) => {
      let query = ` AND ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} != PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) != PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column}::jsonb != PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    orWhereNot: (column: string, value: BaseValues) => {
      let query = ` OR ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} != PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) != PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column}::jsonb != PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    whereBetween: (column: string, min: BaseValues, max: BaseValues) => {
      let query = `\nWHERE ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `\nWHERE JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = `\nWHERE ${column}::jsonb BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    andWhereBetween: (column: string, min: BaseValues, max: BaseValues) => {
      let query = ` AND ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column}::jsonb BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    orWhereBetween: (column: string, min: BaseValues, max: BaseValues) => {
      let query = ` OR ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column}::jsonb BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    whereNotBetween: (column: string, min: BaseValues, max: BaseValues) => {
      let query = `\nWHERE ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `\nWHERE JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = `\nWHERE ${column}::jsonb NOT BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    andWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => {
      let query = ` AND ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column}::jsonb NOT BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    orWhereNotBetween: (column: string, min: BaseValues, max: BaseValues) => {
      let query = ` OR ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column}::jsonb NOT BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    whereIn: (column: string, values: BaseValues[]) => {
      let query = `\nWHERE ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `\nWHERE JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = `\nWHERE ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )}::jsonb IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    andWhereIn: (column: string, values: BaseValues[]) => {
      let query = ` AND ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = ` AND ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )}::jsonb IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    orWhereIn: (column: string, values: BaseValues[]) => {
      let query = ` OR ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = ` OR ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )}::jsonb IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    whereNotIn: (column: string, values: BaseValues[]) => {
      let query = `\nWHERE ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `\nWHERE JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) NOT IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = `\nWHERE ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )}::jsonb NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    andWhereNotIn: (column: string, values: BaseValues[]) => {
      let query = ` AND ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) NOT IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = ` AND ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )}::jsonb NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    orWhereNotIn: (column: string, values: BaseValues[]) => {
      let query = ` OR ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) NOT IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = ` OR ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )}::jsonb NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      return {
        query,
        params,
      };
    },
    whereNull: (column: string) => ({
      query: `\nWHERE ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} IS NULL`,
      params: [],
    }),
    andWhereNull: (column: string) => ({
      query: ` AND ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} IS NULL`,
      params: [],
    }),
    orWhereNull: (column: string) => ({
      query: ` OR ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} IS NULL`,
      params: [],
    }),
    whereNotNull: (column: string) => ({
      query: `\nWHERE ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} IS NOT NULL`,
      params: [],
    }),
    andWhereNotNull: (column: string) => ({
      query: ` AND ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} IS NOT NULL`,
      params: [],
    }),
    orWhereNotNull: (column: string) => ({
      query: ` OR ${convertCase(
        column,
        typeofModel.databaseCaseConvention,
      )} IS NOT NULL`,
      params: [],
    }),
    rawWhere: (query: string, params: any[]) => ({
      query: `\nWHERE ${query}`,
      params,
    }),
    rawAndWhere: (query: string, params: any[]) => ({
      query: ` AND ${query}`,
      params,
    }),
    rawOrWhere: (query: string, params: any[]) => ({
      query: ` OR ${query}`,
      params,
    }),
    whereRegex: (column: string, regex: RegExp) => {
      switch (dbType) {
        case "postgres":
          return {
            query: `\nWHERE ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )} ~ PLACEHOLDER`,
            params: [regex.source],
          };
        case "mysql":
        case "mariadb":
          return {
            query: `\nWHERE ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )} REGEXP PLACEHOLDER`,
            params: [regex.source],
          };
        case "sqlite":
          throw new Error("SQLite does not support REGEXP out of the box");
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    },
    andWhereRegex: (column: string, regex: RegExp) => {
      switch (dbType) {
        case "postgres":
          return {
            query: ` AND ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )} ~ PLACEHOLDER`,
            params: [regex.source],
          };
        case "mysql":
        case "mariadb":
          return {
            query: ` AND ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )} REGEXP PLACEHOLDER`,
            params: [regex.source],
          };
        case "sqlite":
          throw new Error("SQLite does not support REGEXP out of the box");
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    },
    orWhereRegex: (column: string, regex: RegExp) => {
      switch (dbType) {
        case "postgres":
          return {
            query: ` OR ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )} ~ PLACEHOLDER`,
            params: [regex.source],
          };
        case "mysql":
        case "mariadb":
          return {
            query: ` OR ${convertCase(
              column,
              typeofModel.databaseCaseConvention,
            )} REGEXP PLACEHOLDER`,
            params: [regex.source],
          };
        case "sqlite":
          throw new Error("SQLite does not support REGEXP out of the box");
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    },
  };
};

export default whereTemplate;
