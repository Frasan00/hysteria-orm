import { QueryNode } from "../../query";

export class UnionNode extends QueryNode {
  query: QueryNode | QueryNode[] | string;
  isAll: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = true;
  folder = "union";
  file = "union";

  constructor(query: QueryNode | QueryNode[] | string, isAll: boolean = false) {
    super(isAll ? "union all" : "union");
    this.query = query;
    this.isAll = isAll;
  }
}
