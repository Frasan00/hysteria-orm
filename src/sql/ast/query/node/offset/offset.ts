import { QueryNode } from "../../query";

export class OffsetNode extends QueryNode {
  offset: number;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "offset";
  file = "offset";

  constructor(offset: number) {
    super("offset");
    this.offset = offset;
  }
}
