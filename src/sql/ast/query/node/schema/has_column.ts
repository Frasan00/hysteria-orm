import { QueryNode } from "../../query";

export class HasColumnNode extends QueryNode {
  table: string;
  column: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "has_column";

  constructor(table: string, column: string) {
    super("schema");
    this.table = table;
    this.column = column;
  }
}
