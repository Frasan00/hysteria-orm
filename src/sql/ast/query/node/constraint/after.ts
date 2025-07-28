import { QueryNode } from "../../query";

export class AfterConstraintNode extends QueryNode {
  column: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = true;
  folder = "constraint";
  file = "after";

  constructor(column: string) {
    super("");
    this.column = column;
  }
}
