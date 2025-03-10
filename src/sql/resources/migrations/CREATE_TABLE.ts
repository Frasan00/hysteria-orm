import type { SqlDataSourceType } from "../../sql_data_source_types";

const createTableTemplate = {
  createTableIfNotExists: (table: string, dbType: SqlDataSourceType) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `CREATE TABLE IF NOT EXISTS \`${table}\` (\n`;
      case "postgres":
        return `CREATE TABLE IF NOT EXISTS "${table}" (\n`;
      case "sqlite":
        return `CREATE TABLE IF NOT EXISTS "${table}" (\n`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  createTable: (table: string, dbType: SqlDataSourceType) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `CREATE TABLE \`${table}\` (\n`;
      case "postgres":
        return `CREATE TABLE "${table}" (\n`;
      case "sqlite":
        return `CREATE TABLE "${table}" (\n`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  createTableEnd: "\n);",
};

export default createTableTemplate;
