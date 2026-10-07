import { QueryNode } from "../../query";
import { FromNode } from "../from";
import { WithNode } from "../with";

export type InsertNodeOptions = {
  withNodes?: WithNode[];
  source?: QueryNode[];
  targetColumns?: string[];
  ignoreInto?: boolean;
  disambiguateSource?: boolean;
};

export class InsertNode extends QueryNode {
  fromNode: FromNode;
  records: Record<string, any>[];
  returning?: string[];
  disableReturning: boolean;
  withNodes?: WithNode[];
  source?: QueryNode[];
  targetColumns?: string[];
  ignoreInto: boolean;
  disambiguateSource: boolean;
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
    options: InsertNodeOptions = {},
  ) {
    super(
      options.ignoreInto ? "insert ignore into" : "insert into",
      isRawValue,
    );
    this.fromNode = fromNode;
    this.records = records;
    this.returning = returning;
    this.disableReturning = disableReturning;
    this.withNodes = options.withNodes;
    this.source = options.source;
    this.targetColumns = options.targetColumns;
    this.ignoreInto = options.ignoreInto ?? false;
    this.disambiguateSource = options.disambiguateSource ?? false;
  }
}
