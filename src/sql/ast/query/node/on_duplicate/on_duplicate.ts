import { QueryNode } from "../../query";

export class OnDuplicateNode extends QueryNode {
  table: string;
  conflictColumns: string[];
  columnsToUpdate: string[];
  returning?: string[];
  mode: "update" | "ignore";
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "on_duplicate";
  file = "on_duplicate";

  constructor(
    table: string,
    conflictColumns: string[],
    columnsToUpdate: string[],
    mode: "update" | "ignore" = "update",
    returning?: string[],
    isRawValue: boolean = false,
  ) {
    super("on duplicate", isRawValue);
    this.table = table;
    this.conflictColumns = conflictColumns;
    this.columnsToUpdate = columnsToUpdate;
    this.mode = mode;
    this.returning = returning;
  }
}
