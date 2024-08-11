import { camelToSnakeCase } from "../../../CaseUtils";
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
export type BaseValues = string | number | boolean | object;

const whereTemplate = (_tableName: string, dbType: DataSourceType) => {
  return {
    convertPlaceHolderToValue: (query: string, startIndex: number = 1) => {
      switch (dbType) {
        case "mysql":
        case "mariadb":
          return query.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
          let index = startIndex;
          return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new Error("Unsupported database type");
      }
    },
    where: (
      column: string,
      value: BaseValues,
      operator: WhereOperatorType = "=",
    ) => {
      let query = `\nWHERE ${camelToSnakeCase(column)} ${operator} PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
            query = `\nWHERE JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) ${operator} ?`;
            params = [value]; // Use the JSON string directly
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
      operator: WhereOperatorType = "=",
    ) => {
      let query = ` AND ${camelToSnakeCase(column)} ${operator} PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      operator: WhereOperatorType = "=",
    ) => {
      let query = ` OR ${camelToSnakeCase(column)} ${operator} PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = `\nWHERE ${camelToSnakeCase(column)} != PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = ` AND ${camelToSnakeCase(column)} != PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = ` OR ${camelToSnakeCase(column)} != PLACEHOLDER`;
      let params = [value];

      if (typeof value === "object" && value !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = `\nWHERE ${camelToSnakeCase(
        column,
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = ` AND ${camelToSnakeCase(
        column,
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = ` OR ${camelToSnakeCase(
        column,
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = `\nWHERE ${camelToSnakeCase(
        column,
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = ` AND ${camelToSnakeCase(
        column,
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = ` OR ${camelToSnakeCase(
        column,
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];

      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
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
      let query = `\nWHERE ${camelToSnakeCase(column)} IN (${values
        .map((_) => "PLACEHOLDER")
        .join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
            query = `\nWHERE JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = `\nWHERE ${camelToSnakeCase(column)}::jsonb IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
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
      let query = ` AND ${camelToSnakeCase(column)} IN (${values
        .map((_) => "PLACEHOLDER")
        .join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = ` AND ${camelToSnakeCase(column)}::jsonb IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
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
      let query = ` OR ${camelToSnakeCase(column)} IN (${values
        .map((_) => "PLACEHOLDER")
        .join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = ` OR ${camelToSnakeCase(column)}::jsonb IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
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
      let query = `\nWHERE ${camelToSnakeCase(column)} NOT IN (${values
        .map((_) => "PLACEHOLDER")
        .join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
            query = `\nWHERE JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) NOT IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = `\nWHERE ${camelToSnakeCase(column)}::jsonb NOT IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
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
      let query = ` AND ${camelToSnakeCase(column)} NOT IN (${values
        .map((_) => "PLACEHOLDER")
        .join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) NOT IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = ` AND ${camelToSnakeCase(column)}::jsonb NOT IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
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
      let query = ` OR ${camelToSnakeCase(column)} NOT IN (${values
        .map((_) => "PLACEHOLDER")
        .join(", ")})`;
      let params = values;

      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column}, '$')) NOT IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
            break;
          case "postgres":
            query = ` OR ${camelToSnakeCase(column)}::jsonb NOT IN (${values
              .map((_) => "PLACEHOLDER")
              .join(", ")})`;
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
