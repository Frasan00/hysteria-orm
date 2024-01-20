import { Column } from "../../Migrations/Columns/Column";
import { DropColumn } from "../../Migrations/Columns/DropColumn";

export const dropColumnForce = (tableName: string) => {
  return `SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS \`${tableName}\`;
SET FOREIGN_KEY_CHECKS = 1;`;
};
