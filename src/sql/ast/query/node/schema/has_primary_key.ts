import { QueryNode } from "../../query";

export class HasPrimaryKeyNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "has_primary_key";

  constructor(table: string) {
    super("schema");
    this.table = table;
  }
}
