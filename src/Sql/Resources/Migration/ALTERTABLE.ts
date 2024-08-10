import { DataSourceType } from "../../../Datasource";

const alterTableTemplate = (dbType: DataSourceType) => ({
  alterTable: (tableName: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
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
      case "mariadb":
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
      case "mariadb":
        return `\nDROP COLUMN \`${columnName}\``;
      case "postgres":
        return `\nDROP COLUMN "${columnName}"`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  renameColumn: (oldColumnName: string, newColumnName: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nCHANGE COLUMN \`${oldColumnName}\` \`${newColumnName}\``;
      case "postgres":
        return `\nRENAME COLUMN "${oldColumnName}" TO "${newColumnName}"`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  modifyColumn: (columnName: string, columnType: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nMODIFY COLUMN \`${columnName}\` ${columnType}`;
      case "postgres":
        return `\nALTER COLUMN "${columnName}" TYPE ${columnType}`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  addConstraint: (constraint: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nADD ${constraint}`;
      case "postgres":
        return `\nADD ${constraint}`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  dropConstraint: (constraint: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nDROP ${constraint}`;
      case "postgres":
        return `\nDROP ${constraint}`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  renameConstraint: (oldConstraint: string, newConstraint: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nRENAME ${oldConstraint} TO ${newConstraint}`;
      case "postgres":
        return `\nRENAME CONSTRAINT ${oldConstraint} TO ${newConstraint}`;
      default:
        throw new Error("Unsupported database type");
    }
  },
});

export default alterTableTemplate;