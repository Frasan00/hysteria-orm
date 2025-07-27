import { QueryNode } from "../../query";

export class DropPrimaryKeyNode extends QueryNode {
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = false;
  folder = "alter_table";
  file = "drop_primary_key";
  constructor() {
    super("");
  }
}
