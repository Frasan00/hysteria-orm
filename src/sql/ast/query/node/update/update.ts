import { QueryNode } from "../../query";

export class UpdateNode extends QueryNode {
  table: string;
  columns: string[];
  values: any[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "update";
  file = "update";

  constructor(
    table: string,
    columns: string[] = [],
    values: any[] = [],
    isRawValue: boolean = false,
  ) {
    super("update", isRawValue);
    this.table = table;
    this.columns = columns;
    this.values = values;
  }
}
