import { QueryNode } from "../../query";

export class RawNode extends QueryNode {
  rawValue: string;
  bindings?: any[];
  canKeywordBeSeenMultipleTimes = true;
  chainsWith = " ";
  currParamIndex = 0;
  isRawValue = true;
  folder = "raw";
  file = "raw";

  constructor(value: string, bindings?: any[]) {
    super("raw", true);
    this.rawValue = value;
    this.bindings = bindings;
  }
}
