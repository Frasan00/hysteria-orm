import { QueryNode } from "../../query";
import { RawNode } from "../raw/raw_node";
import { SqlFuncNode } from "../sqlfunc/sqlfunc";
import { FromNode } from "../from";
import type { JoinNode } from "../join/join";

export class UpdateNode extends QueryNode {
  fromNode: FromNode;
  columns: string[];
  values: (any | RawNode | SqlFuncNode)[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "update";
  file = "update";
  /** Joins rendered between the table and SET, so MySQL can update from a join. */
  joinNodes?: JoinNode[];
  /** `update ... from <source>`, rendered by the dialects that accept it. */
  fromSourceNode?: FromNode;

  constructor(
    fromNode: FromNode,
    columns: string[] = [],
    values: (any | RawNode | SqlFuncNode)[] = [],
    isRawValue: boolean = false,
  ) {
    super("update", isRawValue);
    this.fromNode = fromNode;
    this.columns = columns;
    this.values = values;
  }
}
