import { DataSourceType } from "../../../Datasource";

const createTableTemplate = {
  createTableIfNotExists: (tableName: string, dbType: DataSourceType) => {
    switch (dbType) {
      case "mysql":
        return `\nCREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
      case "postgres":
        return `\nCREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  createTable: (tableName: string, dbType: DataSourceType) => {
    switch (dbType) {
      case "mysql":
        return `\nCREATE TABLE \`${tableName}\` (\n`;
      case "postgres":
        return `\nCREATE TABLE "${tableName}" (\n`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  createTableEnd: "\n);",
};

export default createTableTemplate;