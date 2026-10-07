import { QueryNode } from "../../query";

export class WithNode extends QueryNode {
  alias: string;
  body: QueryNode | QueryNode[];
  clause: string;
  columns?: string[];
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = false;
  folder = "with";
  file = "with";

  constructor(
    clause: string,
    alias: string,
    body: QueryNode | QueryNode[],
    columns?: string[],
  ) {
    if (clause === "normal") {
      clause = "";
    }

    super("with");
    this.alias = alias;
    this.body = body;
    this.clause = clause;
    this.columns = columns;
  }
}
