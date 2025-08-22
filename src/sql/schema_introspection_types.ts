export type TableColumnInfo = {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | number | boolean | null;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
};

export type TableIndexInfo = {
  name: string;
  columns: string[];
  isUnique: boolean;
};

export type TableSchemaInfo = {
  columns: TableColumnInfo[];
  indexes: TableIndexInfo[];
  foreignKeys: TableForeignKeyInfo[];
};

export type TableForeignKeyInfo = {
  name?: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: string | null;
  onUpdate?: string | null;
};
