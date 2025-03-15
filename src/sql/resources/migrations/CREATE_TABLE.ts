import { HysteriaError } from "../../../errors/hysteria_error";
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
        throw new HysteriaError(
          "CreateTableTemplate::createTableIfNotExists",
          `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
        );
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
        throw new HysteriaError(
          "CreateTableTemplate::createTable",
          `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
        );
    }
  },
  createTableEnd: "\n);",
};

export default createTableTemplate;
