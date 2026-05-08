import { QueryNode } from "../../query";
import { ColumnTypeNode } from "../column";
import { ConstraintNode } from "../constraint/constraint";

export class AddColumnNode extends QueryNode {
  column: ColumnTypeNode;
  inlineConstraints?: ConstraintNode[];
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "add_column";

  constructor(column: ColumnTypeNode) {
    super("");
    this.column = column;
  }
}
