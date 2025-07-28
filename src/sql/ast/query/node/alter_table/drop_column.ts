import { QueryNode } from "../../query";

export class DropColumnNode extends QueryNode {
  column: string;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "drop_column";
  constructor(column: string) {
    super("");
    this.column = column;
  }
}
