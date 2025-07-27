import { QueryNode } from "../../query";

export class AddPrimaryKeyNode extends QueryNode {
  columns: string[];
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = false;
  folder = "alter_table";
  file = "add_primary_key";

  constructor(columns: string[]) {
    super("");
    this.columns = columns;
  }
}
