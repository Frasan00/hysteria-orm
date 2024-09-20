import { DataSourceType } from "../../../Datasource";

const dropTableTemplate = (
  table: string,
  ifExists: boolean,
  dbType: DataSourceType,
) => {
  switch (dbType) {
    case "mariadb":
    case "mysql":
      return ifExists
        ? `DROP TABLE IF EXISTS \`${table}\``
        : `DROP TABLE \`${table}\``;
    case "postgres":
      return ifExists
        ? `DROP TABLE IF EXISTS "${table}"`
        : `DROP TABLE "${table}"`;
    default:
      throw new Error("Unsupported database type");
  }
};

export default dropTableTemplate;
