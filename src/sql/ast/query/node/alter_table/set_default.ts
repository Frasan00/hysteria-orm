import { QueryNode } from "../../query";
import { RawNode } from "../raw/raw_node";

export class SetDefaultNode extends QueryNode {
  column: string;
  defaultValue: string | RawNode;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "set_default";

  constructor(column: string, defaultValue: string | RawNode) {
    super("");
    this.column = column;
    this.defaultValue = defaultValue;
  }
}
