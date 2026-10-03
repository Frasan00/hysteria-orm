import { QueryNode } from "../../query";

/**
 * A SQL comment attached to a select statement.
 * `isHint` distinguishes an optimizer hint comment from a plain comment.
 * Rendered by the parser, not by the keyword loop.
 */
export class CommentNode extends QueryNode {
  value: string;
  isHint: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = true;
  folder = "comment";
  file = "comment";

  constructor(value: string, isHint: boolean = false) {
    super("");
    this.value = value;
    this.isHint = isHint;
  }
}
