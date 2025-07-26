import { QueryNode } from "../../query";

export class LimitNode extends QueryNode {
  limit: number;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "limit";
  file = "limit";

  constructor(limit: number) {
    super("limit");
    this.limit = limit;
  }
}
