import { QueryNode } from "../../query";

export class FromNode extends QueryNode {
  table: string | QueryNode | QueryNode[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "from";
  file = "from";
  alias?: string;
  /** Schema applied to the table reference (e.g. `public.users`). */
  schema?: string;
  /** PostgreSQL `FROM ONLY`, which skips rows of inheriting tables. */
  only?: boolean;

  constructor(table: string | QueryNode | QueryNode[], alias?: string) {
    super("from");
    this.table = table;
    this.alias = alias;
  }
}
