import { QueryNode } from "../../query";
import { ConstraintNode } from "../constraint";

export class AddConstraintNode extends QueryNode {
  constraint: ConstraintNode;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "add_constraint";

  constructor(constraint: ConstraintNode) {
    super("");
    this.constraint = constraint;
  }
}
