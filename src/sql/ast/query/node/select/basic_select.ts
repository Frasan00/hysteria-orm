import { QueryNode } from "../../query";

export class SelectNode extends QueryNode {
  column: string | QueryNode | QueryNode[];
  alias?: string;
  sqlFunction?: string;
  chainsWith = ", ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "select";
  file = "select";

  constructor(
    column: string | QueryNode | QueryNode[],
    alias?: string,
    sqlFunction?: string,
    isRaw?: boolean,
  ) {
    super("select");
    this.column = column;
    this.alias = alias;
    this.sqlFunction = sqlFunction;
    this.isRawValue = isRaw ?? false;
  }
}
