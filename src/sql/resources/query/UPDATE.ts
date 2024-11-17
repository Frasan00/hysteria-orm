import { convertCase } from "../../../utils/case_utils";
import { SqlDataSourceType } from "../../sql_data_source";
import { Model } from "../../models/model";
import { isNestedObject } from "../../../utils/json_utils";
import { getModelColumns } from "../../models/model_decorators";

const updateTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const table = typeofModel.table;
  const modelColumns = getModelColumns(typeofModel);

  return {
    update: (
      columns: string[],
      values: any[],
      primaryKey?: string,
      primaryKeyValue?: string | undefined,
    ) => {
      if (columns.includes("$additionalColumns")) {
        const $additionalColumnsIndex = columns.indexOf("$additionalColumns");
        columns.splice(columns.indexOf("$additionalColumns"), 1);
        values.splice($additionalColumnsIndex, 1);
      }

      for (let i = 0; i < values.length; i++) {
        const column = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn) => modelColumn.columnName === column,
        );
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }

      values = values.map((value) => {
        if (isNestedObject(value)) {
          return JSON.stringify(value);
        }

        return value;
      });

      columns = columns.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );

      let setClause: string;
      let params: (any | null)[];

      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns.map((column) => `\`${column}\` = ?`).join(", ");
          params = [...values, primaryKeyValue];
          break;
        case "postgres":
          setClause = columns
            .map((column, index) => `"${column}" = $${index + 1}`)
            .join(", ");
          params = [...values, primaryKeyValue];
          break;
        default:
          throw new Error("Unsupported database type");
      }

      const primaryKeyPlaceholder =
        dbType === "postgres" ? `$${columns.length + 1}` : "?";
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
      columns = columns.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );

      if (columns.includes("$additionalColumns")) {
        const $additionalColumnsIndex = columns.indexOf("$additionalColumns");
        columns.splice(columns.indexOf("$additionalColumns"), 1);
        values.splice($additionalColumnsIndex, 1);
      }

      for (let i = 0; i < values.length; i++) {
        const column = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn) => modelColumn.columnName === column,
        );
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
          setClause = columns.map((column) => `\`${column}\` = ?`).join(", ");
          values.forEach((value) => {
            if (isNestedObject(value)) {
              params.push(JSON.stringify(value));
              return;
            }

            params.push(value ?? null);
          });
          break;
        case "postgres":
          setClause = columns
            .map((column, index) => `"${column}" = $${index + 1}`)
            .join(", ");
          values.forEach((value) => {
            if (isNestedObject(value)) {
              params.push(JSON.stringify(value));
              return;
            }

            params.push(value ?? null);
          });
          break;
        default:
          throw new Error("Unsupported database type");
      }

      const query = `UPDATE ${table} ${joinClause}
SET ${setClause} ${whereClause}`;

      return { query, params };
    },
  };
};

export default updateTemplate;
