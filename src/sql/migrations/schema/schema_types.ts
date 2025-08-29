export type CommonConstraintOptions = {
  constraintName?: string;
};

export type OnUpdateOrDelete =
  | "cascade"
  | "restrict"
  | "set null"
  | "no action";

export type PrimaryKeyOptions = CommonConstraintOptions;

export type ForeignKeyOptions = CommonConstraintOptions & {
  onDelete?: OnUpdateOrDelete;
  onUpdate?: OnUpdateOrDelete;
};

export type CreateTableContext = "alter_table" | "create_table";
