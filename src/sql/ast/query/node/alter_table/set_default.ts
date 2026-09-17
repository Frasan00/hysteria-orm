import { QueryNode } from "../../query";
import { RawNode } from "../raw/raw_node";
import { SqlFuncNode } from "../sqlfunc/sqlfunc";

export class SetDefaultNode extends QueryNode {
  column: string;
  defaultValue: string | RawNode | SqlFuncNode;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "set_default";

  constructor(column: string, defaultValue: string | RawNode | SqlFuncNode) {
    super("");
    this.column = column;
    this.defaultValue = defaultValue;
  }
}
