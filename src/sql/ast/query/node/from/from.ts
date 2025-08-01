import { QueryNode } from "../../query";

export class FromNode extends QueryNode {
  table: string | QueryNode | QueryNode[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "from";
  file = "from";
  alias?: string;

  constructor(table: string | QueryNode | QueryNode[], alias?: string) {
    super("from");
    this.table = table;
    this.alias = alias;
  }
}
