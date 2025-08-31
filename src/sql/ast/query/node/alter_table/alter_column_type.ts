import { QueryNode } from "../../query";
import { ColumnTypeNode } from "../column";

export interface AlterColumnOptions {
  nullable?: boolean;
  unique?: boolean;
  default?: string | number | boolean | null;
  dropDefault?: boolean;
}

export class AlterColumnTypeNode extends QueryNode {
  column: string;
  newType: ColumnTypeNode;
  options: AlterColumnOptions;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "alter_column_type";

  constructor(
    column: string,
    newType: ColumnTypeNode,
    options: AlterColumnOptions = {},
  ) {
    super("");
    this.column = column;
    this.newType = newType;
    this.options = options;
  }
}
