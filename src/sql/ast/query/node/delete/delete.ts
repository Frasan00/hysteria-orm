import { QueryNode } from "../../query";

export class DeleteNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "delete";
  file = "delete";

  constructor(table: string, isRawValue: boolean = false) {
    super("delete from", isRawValue);
    this.table = table;
  }
}
