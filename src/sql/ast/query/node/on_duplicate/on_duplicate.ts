import { QueryNode } from "../../query";
import type { WhereNode, WhereGroupNode } from "../where";

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
  /** Raw conflict target, rendered in place of the column list. */
  conflictTargetRaw?: string;
  /** Named unique constraint to conflict on. */
  conflictConstraint?: string;
  /** Guards the `do update` clause; PostgreSQL and SQLite only. */
  whereNodes?: (WhereNode | WhereGroupNode)[];

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
