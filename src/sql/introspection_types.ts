export interface IntrospectedColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string | null;
  length?: number;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: { table: string; column: string };
}

export interface IntrospectedForeignKey {
  column: string;
  references: { table: string; column: string };
  onDelete?: string;
  onUpdate?: string;
}

export interface IntrospectedTable {
  name: string;
  columns: IntrospectedColumn[];
  primaryKeys?: string[];
  foreignKeys?: IntrospectedForeignKey[];
  indices?: { name: string; columns: string[]; unique?: boolean }[];
}

export interface IntrospectedSchema {
  dialect: string;
  tables: IntrospectedTable[];
}
