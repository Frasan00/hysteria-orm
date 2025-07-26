import { QueryNode } from "../../query";

export class InsertNode extends QueryNode {
  table: string;
  records: Record<string, any>[];
  returning?: string[];
  disableReturning: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "insert";
  file = "insert";

  constructor(
    table: string,
    records: Record<string, any>[] = [],
    returning?: string[],
    disableReturning: boolean = false,
    isRawValue: boolean = false,
  ) {
    super("insert into", isRawValue);
    this.table = table;
    this.records = records;
    this.returning = returning;
    this.disableReturning = disableReturning;
  }
}
