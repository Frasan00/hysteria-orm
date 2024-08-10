import { DataSourceType } from "../../../Datasource";

const dropTableTemplate = (
  tableName: string,
  ifExists: boolean,
  dbType: DataSourceType,
) => {
  switch (dbType) {
    case "mariadb":
    case "mysql":
      return ifExists
        ? `DROP TABLE IF EXISTS \`${tableName}\``
        : `DROP TABLE \`${tableName}\``;
    case "postgres":
      return ifExists
        ? `DROP TABLE IF EXISTS "${tableName}"`
        : `DROP TABLE "${tableName}"`;
    default:
      throw new Error("Unsupported database type");
  }
};

export default dropTableTemplate;
