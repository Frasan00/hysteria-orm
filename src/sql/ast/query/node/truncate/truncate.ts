import { QueryNode } from "../../query";
import { FromNode } from "../from";

export class TruncateNode extends QueryNode {
  fromNode: FromNode | string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "truncate";
  file = "truncate";

  constructor(fromNode: FromNode | string, isRawValue: boolean = false) {
    super("truncate", isRawValue);
    this.fromNode = fromNode;
  }
}
