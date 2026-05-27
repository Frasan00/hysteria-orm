import { QueryNode } from "../../query";

export class GetTablesNode extends QueryNode {
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "get_tables";

  constructor() {
    super("schema");
  }
}
