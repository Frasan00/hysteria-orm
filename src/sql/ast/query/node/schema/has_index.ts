import { QueryNode } from "../../query";

export class HasIndexNode extends QueryNode {
  table: string;
  index: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "has_index";

  constructor(table: string, index: string) {
    super("schema");
    this.table = table;
    this.index = index;
  }
}
