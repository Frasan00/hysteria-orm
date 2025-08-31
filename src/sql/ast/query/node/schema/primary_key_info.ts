import { QueryNode } from "../../query";

export class PrimaryKeyInfoNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "primary_key_info";

  constructor(table: string) {
    super("schema");
    this.table = table;
  }
}
