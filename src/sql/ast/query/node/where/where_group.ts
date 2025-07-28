import { QueryNode } from "../../query";
import type { WhereNode } from "./where";
import type { WhereSubqueryNode } from "./where_subquery";

export type WhereNodeType =
  | "where"
  | "raw_where"
  | "where_group"
  | "where_subquery";

export class WhereGroupNode extends QueryNode {
  nodes: (WhereNode | WhereGroupNode | WhereSubqueryNode)[];
  chainsWith: "and" | "or";
  canKeywordBeSeenMultipleTimes = false;
  folder = "where";
  file = "where_group";

  constructor(
    nodes: (WhereNode | WhereGroupNode | WhereSubqueryNode)[],
    chainsWith: "and" | "or" = "and",
  ) {
    super("where");
    this.nodes = nodes;
    this.chainsWith = ` ${chainsWith}` as "and" | "or";
  }
}
