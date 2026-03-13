import { QueryNode } from "../../query";
import { FromNode } from "../from";

export class DeleteNode extends QueryNode {
  fromNode: FromNode;
  returning?: string[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "delete";
  file = "delete";

  constructor(
    fromNode: FromNode,
    isRawValue: boolean = false,
    returning?: string[],
  ) {
    super("delete from", isRawValue);
    this.fromNode = fromNode;
    this.returning = returning;
  }
}
