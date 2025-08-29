import { QueryNode } from "../../query";

export class SetNotNullNode extends QueryNode {
  column: string;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "set_not_null";

  constructor(column: string) {
    super("");
    this.column = column;
  }
}
