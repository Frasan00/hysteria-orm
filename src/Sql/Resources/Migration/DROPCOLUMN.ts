import { SqlDataSourceType } from "../../../Datasource";

export const dropColumnForce = (table: string, dbType: SqlDataSourceType) => {
  switch (dbType) {
    case "mariadb":
    case "mysql":
      return `SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS \`${table}\`;
SET FOREIGN_KEY_CHECKS = 1;`;
    case "postgres":
      return `DROP TABLE IF EXISTS "${table}" CASCADE;`;
    default:
      throw new Error("Unsupported database type");
  }
};
