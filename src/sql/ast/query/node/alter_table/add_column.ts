import { QueryNode } from "../../query";
import { ColumnTypeNode } from "../column";

export class AddColumnNode extends QueryNode {
  column: ColumnTypeNode;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "add_column";

  constructor(column: ColumnTypeNode) {
    super("");
    this.column = column;
  }
}
