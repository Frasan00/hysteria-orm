import { QueryNode } from "../../query";

export class LimitNode extends QueryNode {
  limit: number;
  /** Inlines the value instead of binding it, so later parameter indexes do not shift. */
  skipBinding?: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "limit";
  file = "limit";

  constructor(limit: number) {
    super("limit");
    this.limit = limit;
  }
}
