import { QueryNode } from "../../query";

export class DropConstraintNode extends QueryNode {
  constraintName: string;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "drop_constraint";

  constructor(name: string) {
    super("");
    this.constraintName = name;
  }
}
