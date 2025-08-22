import { QueryNode } from "../../query";

export class TableInfoNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "table_info";

  constructor(table: string) {
    super("schema");
    this.table = table;
  }
}
