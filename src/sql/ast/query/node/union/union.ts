import { QueryNode } from "../../query";

export type SetOperationType = "union" | "intersect" | "except";

export class UnionNode extends QueryNode {
  query: QueryNode | QueryNode[] | string;
  isAll: boolean;
  type: SetOperationType;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = true;
  folder = "union";
  file = "union";

  constructor(
    query: QueryNode | QueryNode[] | string,
    isAll: boolean = false,
    type: SetOperationType = "union",
  ) {
    super(isAll ? `${type} all` : type);
    this.query = query;
    this.isAll = isAll;
    this.type = type;
  }
}
