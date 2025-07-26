import { QueryNode } from "../../query";

export class DistinctNode extends QueryNode {
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "distinct";
  file = "distinct";

  constructor() {
    super("distinct");
  }
}
