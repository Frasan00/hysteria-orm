import { QueryNode } from "../../query";

export class FromNode extends QueryNode {
  table: string | QueryNode | QueryNode[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "from";
  file = "from";

  constructor(table: string | QueryNode | QueryNode[]) {
    super("from");
    this.table = table;
  }
}
