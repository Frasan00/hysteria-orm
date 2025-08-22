import { QueryNode } from "../../query";

export class IndexInfoNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "index_info";

  constructor(table: string) {
    super("schema");
    this.table = table;
  }
}
