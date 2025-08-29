import { QueryNode } from "../../query";

export class DropDefaultNode extends QueryNode {
  column: string;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "drop_default";

  constructor(column: string) {
    super("");
    this.column = column;
  }
}
