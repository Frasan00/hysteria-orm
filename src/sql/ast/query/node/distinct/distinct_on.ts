import { QueryNode } from "../../query";

export class DistinctOnNode extends QueryNode {
  columns: string[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "distinct";
  file = "distinct_on";

  constructor(columns: string[]) {
    super("distinct on");
    this.columns = columns;
  }
}
