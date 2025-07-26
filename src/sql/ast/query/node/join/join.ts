import { QueryNode } from "../../query";

export class JoinNode extends QueryNode {
  table: string;
  left: string;
  right: string;
  on?: { left?: string; right?: string; operator: string };
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = true;
  folder = "join";
  file = "join";
  type: "inner" | "left" | "right" | "full" | "cross" | "natural" = "inner";

  constructor(
    table: string,
    left: string,
    right: string,
    type: "inner" | "left" | "right" | "full" | "cross" | "natural" = "inner",
    on: { left?: string; right?: string; operator: string },
    isRawValue: boolean = false,
  ) {
    super(`${type} join`, isRawValue);
    this.table = table;
    this.left = left;
    this.right = right;
    this.on = on;
  }
}
