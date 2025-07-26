import { QueryNode } from "../../query";

export class TruncateNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "truncate";
  file = "truncate";

  constructor(table: string, isRawValue: boolean = false) {
    super("truncate", isRawValue);
    this.table = table;
  }
}
