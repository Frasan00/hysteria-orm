import { QueryNode } from "../../query";

/**
 * Emits a dialect's returning clause for update/delete. Carries no keyword of its
 * own — the parser pushes the interpreter's output verbatim, so each dialect owns
 * both the syntax and, via its position in the parse array, where the clause lands.
 */
export class ReturningNode extends QueryNode {
  columns: string[];
  /** MSSQL needs the operation's pseudo-table (`inserted` / `deleted`) as a column prefix. */
  prefix: "inserted" | "deleted";
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "returning";
  file = "returning";

  constructor(
    columns: string[] = [],
    prefix: "inserted" | "deleted" = "inserted",
  ) {
    super("returning");
    this.columns = columns;
    this.prefix = prefix;
  }
}
