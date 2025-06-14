import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { getModelColumns } from "../../models/decorators/model_decorators";
import { Model } from "../../models/model";
import { SqlDataSourceType } from "../../sql_data_source_types";

export type JsonParam = Record<string, unknown> | any[];

const whereJsonTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const modelColumns = getModelColumns(typeofModel);
  const modelColumnsMap = new Map(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  return {
    whereJson: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: `\nWHERE ${columnName} @> $PLACEHOLDER::jsonb`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: `\nWHERE json(${columnName}) = json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: `\nWHERE JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::whereJson",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    andWhereJson: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` AND ${columnName} @> $PLACEHOLDER::jsonb`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: ` AND json(${columnName}) = json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` AND JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::andWhereJson",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    orWhereJson: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` OR ${columnName} @> $PLACEHOLDER::jsonb`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: ` OR json(${columnName}) = json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` OR JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::orWhereJson",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    whereNotJson: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: `\nWHERE NOT (${columnName} @> $PLACEHOLDER::jsonb)`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: `\nWHERE json(${columnName}) != json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: `\nWHERE NOT JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::whereNotJson",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    andWhereNotJson: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` AND NOT (${columnName} @> $PLACEHOLDER::jsonb)`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: ` AND json(${columnName}) != json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` AND NOT JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::andWhereNotJson",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    orWhereNotJson: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` OR NOT (${columnName} @> $PLACEHOLDER::jsonb)`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: ` OR json(${columnName}) != json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` OR NOT JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::orWhereNotJson",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    whereJsonContains: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: `\nWHERE ${columnName} @> $PLACEHOLDER::jsonb`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: `\nWHERE json(${columnName}) = json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: `\nWHERE JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::whereJsonContains",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    andWhereJsonContains: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` AND ${columnName} @> $PLACEHOLDER::jsonb`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: ` AND json(${columnName}) = json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` AND JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::andWhereJsonContains",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    orWhereJsonContains: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` OR ${columnName} @> $PLACEHOLDER::jsonb`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: ` OR json(${columnName}) = json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` OR JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::orWhereJsonContains",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    whereJsonNotContains: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);

      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: `\nWHERE NOT (${columnName} @> $PLACEHOLDER::jsonb)`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: `\nWHERE json(${columnName}) != json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: `\nWHERE NOT JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::whereJsonNotContains",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    andWhereJsonNotContains: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` AND NOT (${columnName} @> $PLACEHOLDER::jsonb)`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: ` AND json(${columnName}) != json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` AND NOT JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::andWhereJsonNotContains",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    orWhereJsonNotContains: (column: string, value: JsonParam) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` OR NOT (${columnName} @> $PLACEHOLDER::jsonb)`,
            params: [JSON.stringify(value)],
          };
        case "sqlite":
          return {
            query: ` OR json(${columnName}) != json($PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` OR NOT JSON_CONTAINS(${columnName}, $PLACEHOLDER)`,
            params: [JSON.stringify(value)],
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::orWhereJsonNotContains",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    whereJsonIn: (column: string, values: JsonParam[]) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);
      if (!values.length) {
        return { query: `\nWHERE 1 = 0`, params: [] };
      }
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: `\nWHERE ${values.map(() => `${columnName} @> $PLACEHOLDER::jsonb`).join(" OR ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "sqlite":
          return {
            query: `\nWHERE ${values.map(() => `json(${columnName}) = json($PLACEHOLDER)`).join(" OR ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "mariadb":
        case "mysql":
          return {
            query: `\nWHERE ${values.map(() => `JSON_CONTAINS(${columnName}, $PLACEHOLDER)`).join(" OR ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::whereJsonIn",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    andWhereJsonIn: (column: string, values: JsonParam[]) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);
      if (!values.length) {
        return { query: ` AND 1 = 0`, params: [] };
      }
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` AND ${values.map(() => `${columnName} @> $PLACEHOLDER::jsonb`).join(" OR ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "sqlite":
          return {
            query: ` AND ${values.map(() => `json(${columnName}) = json($PLACEHOLDER)`).join(" OR ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` AND ${values.map(() => `JSON_CONTAINS(${columnName}, $PLACEHOLDER)`).join(" OR ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::andWhereJsonIn",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    orWhereJsonIn: (column: string, values: JsonParam[]) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);
      if (!values.length) {
        return { query: ` OR 1 = 0`, params: [] };
      }
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` OR ${values.map(() => `${columnName} @> $PLACEHOLDER::jsonb`).join(" OR ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "sqlite":
          return {
            query: ` OR ${values.map(() => `json(${columnName}) = json($PLACEHOLDER)`).join(" OR ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` OR ${values.map(() => `JSON_CONTAINS(${columnName}, $PLACEHOLDER)`).join(" OR ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::orWhereJsonIn",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    whereJsonNotIn: (column: string, values: JsonParam[]) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);
      if (!values.length) {
        return { query: `\nWHERE 1 = 1`, params: [] };
      }
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: `\nWHERE ${values.map(() => `NOT (${columnName} @> $PLACEHOLDER::jsonb)`).join(" AND ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "sqlite":
          return {
            query: `\nWHERE ${values.map(() => `json(${columnName}) != json($PLACEHOLDER)`).join(" AND ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "mariadb":
        case "mysql":
          return {
            query: `\nWHERE ${values.map(() => `NOT JSON_CONTAINS(${columnName}, $PLACEHOLDER)`).join(" AND ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::whereJsonNotIn",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    andWhereJsonNotIn: (column: string, values: JsonParam[]) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);
      if (!values.length) {
        return { query: ` AND 1 = 1`, params: [] };
      }
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` AND ${values.map(() => `NOT (${columnName} @> $PLACEHOLDER::jsonb)`).join(" AND ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "sqlite":
          return {
            query: ` AND ${values.map(() => `json(${columnName}) != json($PLACEHOLDER)`).join(" AND ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` AND ${values.map(() => `NOT JSON_CONTAINS(${columnName}, $PLACEHOLDER)`).join(" AND ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::andWhereJsonNotIn",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    orWhereJsonNotIn: (column: string, values: JsonParam[]) => {
      const columnName =
        modelColumnsMap.get(column)?.databaseName ??
        convertCase(column, typeofModel.databaseCaseConvention);
      if (!values.length) {
        return { query: ` OR 1 = 1`, params: [] };
      }
      switch (dbType) {
        case "postgres":
        case "cockroachdb":
          return {
            query: ` OR ${values.map(() => `NOT (${columnName} @> $PLACEHOLDER::jsonb)`).join(" AND ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "sqlite":
          return {
            query: ` OR ${values.map(() => `json(${columnName}) != json($PLACEHOLDER)`).join(" AND ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        case "mariadb":
        case "mysql":
          return {
            query: ` OR ${values.map(() => `NOT JSON_CONTAINS(${columnName}, $PLACEHOLDER)`).join(" AND ")}`,
            params: values.map((v) => JSON.stringify(v)),
          };
        default:
          throw new HysteriaError(
            "WhereJsonTemplate::orWhereJsonNotIn",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    },
    whereJsonRaw: (raw: string, params: any[] = []) => ({
      query: `\nWHERE ${raw}`,
      params,
    }),
    andWhereJsonRaw: (raw: string, params: any[] = []) => ({
      query: ` AND ${raw}`,
      params,
    }),
    orWhereJsonRaw: (raw: string, params: any[] = []) => ({
      query: ` OR ${raw}`,
      params,
    }),
  };
};

export default whereJsonTemplate;
