import { QueryNode } from "../../query";

export class RawNode extends QueryNode {
  rawValue: string;
  canKeywordBeSeenMultipleTimes = true;
  chainsWith = " ";
  currParamIndex = 0;
  isRawValue = true;
  folder = "raw";
  file = "raw";

  constructor(value: string) {
    super("raw", true);
    this.rawValue = value;
  }
}
