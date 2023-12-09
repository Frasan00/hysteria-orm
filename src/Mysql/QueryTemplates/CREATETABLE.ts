import { Column } from "../Migrations/Columns/Column";

export const createTable = (tableName: string, columns: Column[]): string => {
  const columnNames: string[] = [];
  columns.forEach((column) => {
    const columnConfig = column.config;
    const columnLength = column.length;
    const columnType = column.type;
    const columnName = column.name;

    let columnString = `${columnName} ${columnType}`;

    if (columnLength) {
      columnString += `(${columnLength})`;
    }

    if (column.values) {
      columnString += `(${column.values.join(", ")})`;
    }

    if (columnConfig) {
      if (columnConfig.autoIncrement) {
        columnString += " AUTO_INCREMENT";
      }

      if (columnConfig.unsigned) {
        columnString += " UNSIGNED";
      }

      if (columnConfig.nullable === false) {
        columnString += " NOT NULL";
      }

      if (columnConfig.primary) {
        columnString += " PRIMARY KEY";
      }

      if (columnConfig.unique) {
        columnString += " UNIQUE";
      }

      if (columnConfig.defaultValue) {
        columnString += ` DEFAULT ${columnConfig.defaultValue}`;
      }

      if (columnConfig.autoCreate) {
        columnString += " ON UPDATE CURRENT_TIMESTAMP";
      }

      if (columnConfig.references) {
        columnString += ` REFERENCES ${columnConfig.references.table}(${columnConfig.references.column})`;
      }

      if (columnConfig.cascade) {
        columnString += " ON DELETE CASCADE";
      }
    }

    columnNames.push(columnString);
  });

  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columnNames.join(
    ",\n",
  )}\n);`;
};
