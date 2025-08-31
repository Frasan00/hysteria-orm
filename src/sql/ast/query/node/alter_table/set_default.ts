import { QueryNode } from "../../query";

export class SetDefaultNode extends QueryNode {
  column: string;
  defaultValue: string;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "set_default";

  constructor(column: string, defaultValue: string) {
    super("");
    this.column = column;
    this.defaultValue = defaultValue;
  }
}
