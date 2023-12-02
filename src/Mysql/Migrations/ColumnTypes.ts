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

export type ColumnConfig = {
  autoIncrement: "AUTO_INCREMENT";
  notNull: "NOT NULL";
  null: "NULL";
  unique: "UNIQUE";
  primaryKey: "PRIMARY KEY";
  defaultValue: "DEFAULT";
  check: "CHECK";
};
