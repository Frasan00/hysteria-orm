import { QueryNode } from "../../query";

export class DistinctOnNode extends QueryNode {
  columns: string[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "distinctOn";
  file = "distinct_on";

  constructor(columns: string[]) {
    super("select");
    this.columns = columns;
  }
}
