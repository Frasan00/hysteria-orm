import { DataSourceType } from "../../../Datasource";

const alterTableTemplate = (dbType: DataSourceType) => ({
  alterTable: (tableName: string) => {
    switch (dbType) {
      case "mysql":
        return `\nALTER TABLE \`${tableName}\``;
      case "postgres":
        return `\nALTER TABLE "${tableName}"`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  addColumn: (columnName: string, columnType: string) => {
    switch (dbType) {
      case "mysql":
        return `\nADD COLUMN \`${columnName}\` ${columnType}`;
      case "postgres":
        return `\nADD COLUMN "${columnName}" ${columnType}`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  dropColumn: (columnName: string) => {
    switch (dbType) {
      case "mysql":
        return `\nDROP COLUMN \`${columnName}\``;
      case "postgres":
        return `\nDROP COLUMN "${columnName}"`;
      default:
        throw new Error("Unsupported database type");
    }
  },
});

export default alterTableTemplate;