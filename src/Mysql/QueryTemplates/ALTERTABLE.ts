import { Column } from "../Migrations/Columns/Column";

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
    const after = column.after;
    const alterTable = `ALTER TABLE ${tableName}\n`;

    let columnString = "";

    if(column.oldName) {
        columnString += `${alterTable} RENAME COLUMN ${column.oldName} ${columnName} ${columnType}`;
    } else {
      if (column.alter) {
        columnString += `${alterTable} MODIFY COLUMN ${column.oldName} ${columnName} ${columnType}`;
      } else {
        columnString += `${alterTable} ADD COLUMN ${columnName} ${columnType}`;
      }
    }

    if (columnConfig) {
      if (columnConfig.autoIncrement) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} AUTO_INCREMENT\n`;
      }

      if (columnConfig.nullable) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} NULL;\n`;
      }

      if (!columnConfig.nullable) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} NOT NULL;\n`;
      }

      if (columnConfig.unsigned) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} UNSIGNED;\n`;
      }

      if (columnConfig.primary) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} PRIMARY KEY;\n`;
      }

      if (columnConfig.unique) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} UNIQUE;\n`;
      }

      if (columnConfig.defaultValue) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} DEFAULT ${columnConfig.defaultValue};\n`;
      }

      if (columnConfig.autoCreate) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} ON UPDATE CURRENT_TIMESTAMP;\n`;
      }

      if (columnConfig.references) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} REFERENCES ${columnConfig.references.table}(${columnConfig.references.column});\n`;
      }

      if (columnConfig.cascade) {
        columnString += `${alterTable} ALTER COLUMN ${column.name} MODIFY ${columnName} ON DELETE CASCADE;\n`;
      }
    }

    if (columnString) {
      columnNames.push(columnString);
    }
  });

  return `${columnNames.join(`\n`)}`;
};
