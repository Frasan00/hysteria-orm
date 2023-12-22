import { Column } from "../../Migrations/Columns/Column";

export const alterTable = (
  tableName: string,
  alterColumns: Column[],
): string => {
  const columnNames: string[] = [];
  alterColumns.forEach((column: Column) => {
    const columnConfig = column.config;
    const columnLength = column.length;
    const columnType = column.type;
    const columnName = column.name;
    const oldColumnName = column.oldName;
    const after = column.after;
    let columnDefinition = "";

    if (oldColumnName) {
      columnDefinition += `CHANGE COLUMN ${oldColumnName} ${columnName} ${columnType}`;
    } else if (column.alter) {
      columnDefinition += `MODIFY COLUMN ${columnName} ${columnType}`;
    } else {
      columnDefinition += `ADD COLUMN ${columnName} ${columnType}`;
    }

    if (columnLength) {
      columnDefinition += `(${columnLength})`;
    }
    if (columnConfig.unsigned) {
      columnDefinition += " UNSIGNED";
    }
    if (columnConfig.nullable) {
      columnDefinition += " NULL";
    } else {
      columnDefinition += " NOT NULL";
    }
    if (columnConfig.autoIncrement) {
      columnDefinition += " AUTO_INCREMENT";
    }
    if (columnConfig.defaultValue) {
      columnDefinition += ` DEFAULT '${columnConfig.defaultValue}'`;
    }
    if (columnConfig.references) {
      columnDefinition += ` REFERENCES ${columnConfig.references.table}(${columnConfig.references.column})`;
    }
    if (columnConfig.cascade) {
      columnDefinition += " ON DELETE CASCADE ON UPDATE CASCADE";
    }
    if (columnConfig.primary) {
      columnDefinition += " PRIMARY KEY";
    }
    if (columnConfig.unique) {
      columnDefinition += " UNIQUE";
    }
    if (columnConfig.autoCreate) {
      columnDefinition += " AUTO_CREATE";
    }
    if (columnConfig.autoUpdate) {
      columnDefinition += " AUTO_UPDATE";
    }
    if (after) {
      columnDefinition += ` AFTER ${after}`;
    }
    columnNames.push(columnDefinition);
  });

  return `ALTER TABLE ${tableName} ${columnNames.join(",\n")};`;
};
