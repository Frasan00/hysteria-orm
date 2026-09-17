import { QueryNode } from "../../query";
import { RawNode } from "../raw/raw_node";

export type SqlFuncToken = "$uuid" | "$now" | "$currentTimestamp";

/**
 * @description Expression node for the global `sqlFunc` token namespace.
 * @internal
 */
export class SqlFuncNode extends QueryNode {
  fn: string;
  args: (string | number | SqlFuncNode | RawNode)[];
  chainsWith = ", ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "sqlfunc";
  file = "sqlfunc";

  constructor(
    fn: string,
    args: (string | number | SqlFuncNode | RawNode)[] = [],
  ) {
    super("sqlfunc");
    this.fn = fn;
    this.args = args;
  }
}

export const sqlFunc = {
  uuid: () => new SqlFuncNode("$uuid"),
  now: () => new SqlFuncNode("$now"),
  currentTimestamp: () => new SqlFuncNode("$currentTimestamp"),
};
