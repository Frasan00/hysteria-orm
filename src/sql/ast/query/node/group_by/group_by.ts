import { QueryNode } from "../../query";

export class GroupByNode extends QueryNode {
  column: string;
  chainsWith = ", ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "group_by";
  file = "group_by";

  constructor(column: string, isRawValue: boolean = false) {
    super("group by", isRawValue);
    this.column = column;
  }
}
