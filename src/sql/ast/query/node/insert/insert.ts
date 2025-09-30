import { QueryNode } from "../../query";
import { FromNode } from "../from";

export class InsertNode extends QueryNode {
  fromNode: FromNode;
  records: Record<string, any>[];
  returning?: string[];
  disableReturning: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "insert";
  file = "insert";

  constructor(
    fromNode: FromNode,
    records: Record<string, any>[] = [],
    returning?: string[],
    disableReturning: boolean = false,
    isRawValue: boolean = false,
  ) {
    super("insert into", isRawValue);
    this.fromNode = fromNode;
    this.records = records;
    this.returning = returning;
    this.disableReturning = disableReturning;
  }
}
