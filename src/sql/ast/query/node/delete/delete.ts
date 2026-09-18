import { QueryNode } from "../../query";
import { FromNode } from "../from";

export class DeleteNode extends QueryNode {
  fromNode: FromNode;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "delete";
  file = "delete";

  constructor(fromNode: FromNode, isRawValue: boolean = false) {
    super("delete from", isRawValue);
    this.fromNode = fromNode;
  }
}
