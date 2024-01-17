import { Column } from "../../Migrations/Columns/Column";
import { DropColumn } from "../../Migrations/Columns/DropColumn";

export const dropColumn = (tableName: string, dropColumn: DropColumn[]) => {
  const columnString = dropColumn.map((dropColumn: DropColumn) => {
    if (dropColumn.foreignKey) {
      return `DROP FOREIGN KEY ${dropColumn.name}`;
    }
    return `DROP COLUMN ${dropColumn.name}`;
  });

  return `ALTER TABLE ${tableName} ${columnString.join(", ")};`;
};
