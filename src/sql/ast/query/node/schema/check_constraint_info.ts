import { QueryNode } from "../../query";

export class CheckConstraintInfoNode extends QueryNode {
  table: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "check_constraint_info";

  constructor(table: string) {
    super("schema");
    this.table = table;
  }
}
