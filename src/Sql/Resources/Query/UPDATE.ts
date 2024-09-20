import { convertCase } from "../../../CaseUtils";
import { DataSourceType } from "../../../Datasource";
import { Model } from "../../Models/Model";

const updateTemplate = (dbType: DataSourceType, typeofModel: typeof Model) => {
  const table = typeofModel.metadata.tableName;
  return {
    update: (
      columns: string[],
      values: string[],
      primaryKey?: string,
      primaryKeyValue?: string | undefined,
    ) => {
      if (columns.includes("extraColumns")) {
        const extraColumnsIndex = columns.indexOf("extraColumns");
        columns.splice(columns.indexOf("extraColumns"), 1);
        values.splice(extraColumnsIndex, 1);
      }

      columns = columns.map((column) =>
        convertCase(column, typeofModel.databaseCaseConvention),
      );
      let setClause: string;
      let params: (string | undefined)[];

      switch (dbType) {
        case "mysql":
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

      const query = `UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ${
        dbType === "mysql" ? "?" : `$${columns.length + 1}`
      };`;

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
      let setClause: string;
      const params: any[] = [];

      switch (dbType) {
        case "mysql":
        case "mariadb":
          setClause = columns.map((column) => `\`${column}\` = ?`).join(", ");
          values.forEach((value) => {
            params.push(value);
          });
          break;
        case "postgres":
          setClause = columns
            .map((column, index) => `"${column}" = $${index + 1}`)
            .join(", ");
          values.forEach((value) => {
            params.push(value);
          });
          break;
        default:
          throw new Error("Unsupported database type");
      }

      let query = `UPDATE ${table} ${joinClause} SET ${setClause} ${whereClause}`;
      dbType === "postgres" && (query += " RETURNING *;");

      return { query, params };
    },
  };
};

export default updateTemplate;
