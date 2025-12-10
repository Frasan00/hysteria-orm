import { QueryNode } from "../../query";
import { RawNode } from "../raw/raw_node";

export type ConstraintType =
  | "primary_key"
  | "foreign_key"
  | "unique"
  | "not_null"
  | "null"
  | "default";

export class ConstraintNode extends QueryNode {
  constraintType: ConstraintType;
  columns?: (string | (() => string))[];
  references?: { table: string; columns: (string | (() => string))[] };
  constraintName?: string;
  onDelete?: "cascade" | "restrict" | "set null" | "no action";
  onUpdate?: "cascade" | "restrict" | "set null" | "no action";
  defaultValue?: string | RawNode | undefined;
  checkExpression?: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = true;
  folder = "constraint";
  file = "constraint";

  constructor(
    constraintType: ConstraintType,
    args: {
      columns?: string[];
      references?: { table: string; columns: string[] };
      constraintName?: string;
      onDelete?: "cascade" | "restrict" | "set null" | "no action";
      onUpdate?: "cascade" | "restrict" | "set null" | "no action";
      defaultValue?: string | RawNode | undefined;
      checkExpression?: string;
    } = {},
    isRawValue: boolean = false,
  ) {
    super("");
    this.constraintType = constraintType;
    this.columns = args.columns;
    this.references = args.references;
    this.constraintName = args.constraintName;
    this.onDelete = args.onDelete;
    this.onUpdate = args.onUpdate;
    this.defaultValue = args.defaultValue;
    this.checkExpression = args.checkExpression;
    this.isRawValue = isRawValue;
  }
}
