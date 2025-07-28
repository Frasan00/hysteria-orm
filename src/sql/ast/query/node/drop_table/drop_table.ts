import { QueryNode } from "../../query";

export class DropTableNode extends QueryNode {
  table: string;
  ifExists: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "drop_table";
  file = "drop_table";

  constructor(table: string, ifExists: boolean = false) {
    super("drop table");
    this.table = table;
    this.ifExists = ifExists;
  }
}
