import { QueryNode } from "../../query";
import type { WhereNode, WhereGroupNode, WhereSubqueryNode } from "../where";

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
  additionalConditions?: (WhereNode | WhereGroupNode | WhereSubqueryNode)[];
  /** When set, renders `using (cols)` instead of an `on` condition. */
  using?: string[];
  /** Schema applied to the joined table reference. */
  schema?: string;
  /** Values for the `?` placeholders of a raw join fragment. */
  bindings?: any[];
  /** When set, `table` holds the derived table's alias and this holds its body. */
  subquery?: QueryNode[];

  constructor(
    table: string,
    left: string,
    right: string,
    type: "inner" | "left" | "right" | "full" | "cross" | "natural" = "inner",
    on: { left?: string; right?: string; operator: string },
    isRawValue: boolean = false,
    additionalConditions?: (WhereNode | WhereGroupNode | WhereSubqueryNode)[],
  ) {
    super(`${type} join`, isRawValue);
    this.table = table;
    this.left = left;
    this.right = right;
    this.type = type;
    this.on = on;
    this.additionalConditions = additionalConditions;
  }
}
