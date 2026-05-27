import { QueryNode } from "../../query";

export class GetColumnListingNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "get_column_listing";

  constructor(table: string) {
    super("schema");
    this.table = table;
  }
}
