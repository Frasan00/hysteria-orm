import { QueryNode } from "../../query";
import { RawNode } from "../raw/raw_node";
import { FromNode } from "../from";

export class UpdateNode extends QueryNode {
  fromNode: FromNode;
  columns: string[];
  values: (any | RawNode)[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "update";
  file = "update";

  constructor(
    fromNode: FromNode,
    columns: string[] = [],
    values: (any | RawNode)[] = [],
    isRawValue: boolean = false,
  ) {
    super("update", isRawValue);
    this.fromNode = fromNode;
    this.columns = columns;
    this.values = values;
  }
}
