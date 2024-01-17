type NumericType =
  | "INT"
  | "BIGINT"
  | "FLOAT"
  | "DOUBLE"
  | "DECIMAL"
  | "TINYINT"
  | "SMALLINT"
  | "MEDIUMINT";
type StringType =
  | "UUID"
  | "VARCHAR"
  | "TEXT"
  | "CHAR"
  | "TINYTEXT"
  | "MEDIUMTEXT"
  | "LONGTEXT";
type DateTimeType = "DATE" | "DATETIME" | "TIMESTAMP" | "TIME";
type BooleanType = "BOOLEAN" | "BIT";
type EnumType = "ENUM";
type SetType = "SET";

export type ColumnType =
  | NumericType
  | StringType
  | DateTimeType
  | BooleanType
  | EnumType
  | SetType;

export interface ColumnConfig {
  autoIncrement?: boolean;
  unsigned?: boolean;
  nullable?: boolean;
  unique?: boolean;
  primary?: boolean;
  references?: {
    table: string;
    column: string;
  };
  defaultValue?: string | number | boolean;
  autoCreate?: boolean;
  autoUpdate?: boolean;
  cascade?: boolean;
}

export interface AlterColumnConfig {
  alteredColumn: string;
  autoIncrement?: boolean;
  unsigned?: boolean;
  nullable?: boolean;
  unique?: boolean;
  primary?: boolean;
  references?: {
    table: string;
    column: string;
  };
  defaultValue?: string;
  autoCreate?: boolean;
  autoUpdate?: boolean;
}
