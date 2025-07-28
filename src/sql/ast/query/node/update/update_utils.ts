import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { getModelColumns } from "../../models/decorators/model_decorators";
import { Model } from "../../models/model";
import type { SqlDataSourceType } from "../../sql_data_source_types";

const updateTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const table = typeofModel.table;
  const modelColumns = getModelColumns(typeofModel);
  const modelColumnsMap = new Map(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  return {
    increment: (
      column: string,
      value: number = 1,
      whereClause: string,
      joinClause: string = "",
    ) => {
      const query = `UPDATE ${table} ${joinClause}
SET ${column} = ${column} + ${value} ${whereClause}`;
      return { query, params: [] };
    },

    decrement: (
      column: string,
      value: number = 1,
      whereClause: string,
      joinClause: string = "",
    ) => {
      const query = `UPDATE ${table} ${joinClause}
SET ${column} = ${column} - ${value} ${whereClause}`;
      return { query, params: [] };
    },

    update: (
      columns: string[],
      values: any[],
      primaryKey?: string,
      primaryKeyValue?: string | undefined,
    ) => {
      columns = columns.filter((column) => column !== "*");
      if (columns.includes("$annotations")) {
        const $additionalColumnsIndex = columns.indexOf("$annotations");
        columns.splice(columns.indexOf("$annotations"), 1);
        values.splice($additionalColumnsIndex, 1);
      }

      const modelColumnsMap = new Map(
        modelColumns.map((modelColumn) => [
          modelColumn.columnName,
          modelColumn,
        ]),
      );

      for (let i = 0; i < values.length; i++) {
        const column = columns[i];
        const modelColumn = modelColumnsMap.get(column);
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }

      columns = columns.map(
        (column) =>
          modelColumnsMap.get(column)?.databaseName ??
          convertCase(column, typeofModel.databaseCaseConvention),
      );

      let setClause: string;
      let params: any[];

      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns
            .map((column, index) => {
              return `${column} = ${getPlaceholder(values[index], index, dbType)}`;
            })
            .join(", ");
          params = [
            ...values.map((v) => formatValue(v, dbType)),
            primaryKeyValue,
          ];
          break;
        case "postgres":
        case "cockroachdb":
          setClause = columns
            .map((column, index) => {
              return `${column} = ${getPlaceholder(values[index], index, dbType)}`;
            })
            .join(", ");
          params = [
            ...values.map((v) => formatValue(v, dbType)),
            primaryKeyValue,
          ];
          break;
        default:
          throw new HysteriaError(
            "UpdateTemplate::update",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }

      const primaryKeyPlaceholder =
        dbType === "postgres" || dbType === "cockroachdb"
          ? `$${columns.length + 1}`
          : "?";
      const query = `UPDATE ${table}
SET ${setClause}
WHERE ${primaryKey} = ${primaryKeyPlaceholder};`;

      return { query, params };
    },

    massiveUpdate: (
      columns: string[],
      values: any[],
      whereClause: string,
      joinClause: string = "",
    ) => {
      columns = columns.map(
        (column) =>
          modelColumnsMap.get(column)?.databaseName ??
          convertCase(column, typeofModel.databaseCaseConvention),
      );

      columns = columns.filter((column) => column !== "*");

      for (let i = 0; i < values.length; i++) {
        const column = columns[i];
        const modelColumn = modelColumnsMap.get(column);
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }

      let setClause: string;
      const params: any[] = [];

      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns
            .map((column, index) => {
              return `${column} = ${getPlaceholder(values[index], index, dbType)}`;
            })
            .join(", ");
          values.forEach((value) => {
            params.push(formatValue(value, dbType));
          });
          break;
        case "postgres":
        case "cockroachdb":
          setClause = columns
            .map((column, index) => {
              return `${column} = ${getPlaceholder(values[index], index, dbType)}`;
            })
            .join(", ");
          values.forEach((value) => {
            params.push(formatValue(value, dbType));
          });
          break;
        default:
          throw new HysteriaError(
            "UpdateTemplate::massiveUpdate",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }

      const query = `UPDATE ${table} ${joinClause}
SET ${setClause} ${whereClause}`;

      return { query, params };
    },
  };
};

export default updateTemplate;
