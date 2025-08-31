import { QueryNode } from "../../query";

export class DropNotNullNode extends QueryNode {
  column: string;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "drop_not_null";

  constructor(column: string) {
    super("");
    this.column = column;
  }
}
