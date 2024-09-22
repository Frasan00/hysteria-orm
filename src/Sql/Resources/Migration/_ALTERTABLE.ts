// UNUSED

import { SqlDataSourceType } from "../../../Datasource";

const alterTableTemplate = (dbType: SqlDataSourceType) => ({
  alterTable: (table: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nALTER TABLE \`${table}\``;
      case "postgres":
        return `\nALTER TABLE "${table}"`;
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
  addIndex: (indexName: string, columns: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nADD INDEX \`${indexName}\` (${columns})`;
      case "postgres":
        return `\nCREATE INDEX ${indexName} ON ${columns}`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  dropIndex: (indexName: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nDROP INDEX \`${indexName}\``;
      case "postgres":
        return `\nDROP INDEX ${indexName}`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  addPrimaryKey: (columns: string) => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nADD PRIMARY KEY (${columns})`;
      case "postgres":
        return `\nADD PRIMARY KEY (${columns})`;
      default:
        throw new Error("Unsupported database type");
    }
  },
  dropPrimaryKey: () => {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\nDROP PRIMARY KEY`;
      case "postgres":
        return `\nDROP CONSTRAINT PRIMARY KEY`;
      default:
        throw new Error("Unsupported database type");
    }
  },
});

export default alterTableTemplate;
