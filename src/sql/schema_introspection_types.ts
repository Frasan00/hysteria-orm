export type TableColumnInfo = {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | number | boolean | null;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  withTimezone?: boolean | null;
};

export type TableIndexInfo = {
  name: string;
  columns: string[];
  isUnique: boolean;
};

export type TablePrimaryKeyInfo = {
  name?: string;
  columns: string[];
};

export type TableSchemaInfo = {
  columns: TableColumnInfo[];
  indexes: TableIndexInfo[];
  foreignKeys: TableForeignKeyInfo[];
  primaryKey?: TablePrimaryKeyInfo;
};

export type TableForeignKeyInfo = {
  name?: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: string | null;
  onUpdate?: string | null;
};
