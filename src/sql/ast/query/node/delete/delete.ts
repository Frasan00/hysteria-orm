import { QueryNode } from "../../query";
import { FromNode } from "../from";
import type { JoinNode } from "../join/join";

export class DeleteNode extends QueryNode {
  fromNode: FromNode;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "delete";
  file = "delete";
  /** Joins rendered after the table, so MySQL can delete from a join. */
  joinNodes?: JoinNode[];
  /** `delete ... using <source>`, rendered by the dialects that accept it. */
  usingNode?: FromNode;

  constructor(fromNode: FromNode, isRawValue: boolean = false) {
    super("delete from", isRawValue);
    this.fromNode = fromNode;
  }
}
