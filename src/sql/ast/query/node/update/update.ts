import { QueryNode } from "../../query";
import { RawNode } from "../raw/raw_node";

export class UpdateNode extends QueryNode {
  table: string;
  columns: string[];
  values: (any | RawNode)[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "update";
  file = "update";

  constructor(
    table: string,
    columns: string[] = [],
    values: (any | RawNode)[] = [],
    isRawValue: boolean = false,
  ) {
    super("update", isRawValue);
    this.table = table;
    this.columns = columns;
    this.values = values;
  }
}
