import { Table } from "../../Migrations/Table";

export const dropTruncateTable = (table: Table) => {
  if (table.dropTable) {
    return `DROP TABLE ${table.tableName};`;
  }
  if (table.truncateTable) {
    return `TRUNCATE TABLE ${table.tableName};`;
  }
  return "";
};
