import { DataSourceType } from "../../../Datasource";

export const dropColumnForce = (tableName: string, dbType: DataSourceType) => {
  switch (dbType) {
    case "mariadb":
    case "mysql":
      return `SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS \`${tableName}\`;
SET FOREIGN_KEY_CHECKS = 1;`;
    case "postgres":
      return `DROP TABLE IF EXISTS "${tableName}" CASCADE;`;
    default:
      throw new Error("Unsupported database type");
  }
};
