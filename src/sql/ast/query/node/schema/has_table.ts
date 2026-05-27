import { QueryNode } from "../../query";

export class HasTableNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "has_table";

  constructor(table: string) {
    super("schema");
    this.table = table;
  }
}
