import { QueryNode } from "../../query";

export class OffsetNode extends QueryNode {
  offset: number;
  /** Inlines the value instead of binding it, so later parameter indexes do not shift. */
  skipBinding?: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "offset";
  file = "offset";

  constructor(offset: number) {
    super("offset");
    this.offset = offset;
  }
}
