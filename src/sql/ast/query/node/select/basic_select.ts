import { QueryNode } from "../../query";

export class SelectNode extends QueryNode {
  column: string | QueryNode | QueryNode[];
  alias?: string;
  sqlFunction?: string;
  /** Renders the aggregate as `fn(DISTINCT col)` (e.g. count/sum/avg). */
  distinct?: boolean;
  chainsWith = ", ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "select";
  file = "select";

  constructor(
    column: string | QueryNode | QueryNode[],
    alias?: string,
    sqlFunction?: string,
    isRaw?: boolean,
    distinct?: boolean,
  ) {
    super("select");
    this.column = column;
    this.alias = alias;
    this.sqlFunction = sqlFunction;
    this.isRawValue = isRaw ?? false;
    this.distinct = distinct;
  }
}
