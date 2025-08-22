import { QueryNode } from "../../query";

export class ForeignKeyInfoNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "foreign_key_info";

  constructor(table: string) {
    super("schema");
    this.table = table;
  }
}
