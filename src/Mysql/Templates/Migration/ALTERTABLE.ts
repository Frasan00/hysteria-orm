import { Column } from "../../Migrations/Columns/Column";

export const alterTable = (
    tableName: string,
    alterColumns: Column[]
): string => {
  const alterStatements: string[] = [];

  alterColumns.forEach((column: Column) => {
    const columnConfig = column.config;
    const columnLength = column.length;
    const columnType = column.type;
    const columnName = column.name;
    const oldColumnName = column.oldName;
    const after = column.after;

    let columnDefinition = "";

    if (column.alter) {
      columnDefinition += `CHANGE COLUMN ${oldColumnName} ${columnName} ${columnType}`;
    } else {
      columnDefinition += `ADD COLUMN ${columnName} ${columnType}${getColumnLength(columnType, columnLength)}`;
    }
    columnDefinition += generateColumnConfig(column);

    if (column.alter && after) {
      columnDefinition += ` AFTER ${after}`;
    }

    const alterStatement = `ALTER TABLE ${tableName} ${columnDefinition};`;
    alterStatements.push(alterStatement);
  });

  return alterStatements.join("\n");
};

function generateColumnConfig(column: Column): string {
  let configString = "";
  configString += column.config.nullable ? " NULL" : " NOT NULL";
  configString += column.config.unique ? " UNIQUE" : "";
  configString += column.config.autoIncrement ? " AUTO_INCREMENT" : "";

  if (column.config.primary) {
    configString += " PRIMARY KEY";
  }

  if (column.config.defaultValue !== undefined) {
    configString += ` DEFAULT ${column.config.defaultValue}`;
  }

  if (column.config.references) {
    configString += ` REFERENCES ${column.config.references.table}(${column.config.references.column})`;
    configString += column.config.cascade ? " ON DELETE CASCADE" : "";
  }

  return configString;
}

function getColumnLength(columnType: string, columnLength?: number): string {
  if (columnLength !== undefined) {
    if (columnType.toLowerCase() === "varchar") {
      return `(${columnLength})`;
    }
  }
  return "";
}
