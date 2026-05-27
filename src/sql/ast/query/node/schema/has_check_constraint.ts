import { QueryNode } from "../../query";

export class HasCheckConstraintNode extends QueryNode {
  table: string;
  constraint: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "schema";
  file = "has_check_constraint";

  constructor(table: string, constraint: string) {
    super("schema");
    this.table = table;
    this.constraint = constraint;
  }
}
