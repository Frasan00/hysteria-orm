import { QueryNode } from "../../query";

export type SubqueryOperatorType =
  | "in"
  | "not in"
  | "exists"
  | "not exists"
  | "between"
  | "not between"
  | ">"
  | "<"
  | ">="
  | "<=";

export class WhereSubqueryNode extends QueryNode {
  column: string;
  operator: SubqueryOperatorType;
  subquery: string | QueryNode | QueryNode[];
  chainsWith: "and" | "or";
  canKeywordBeSeenMultipleTimes = false;
  folder = "where";
  file = "where_subquery";

  constructor(
    column: string,
    operator: SubqueryOperatorType,
    subquery: string | QueryNode | QueryNode[],
    chainsWith: "and" | "or" = "and",
  ) {
    super("where");
    this.column = column;
    this.operator = operator;
    this.subquery = subquery;
    this.chainsWith = ` ${chainsWith}` as "and" | "or";
  }
}
