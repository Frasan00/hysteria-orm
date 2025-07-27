import { QueryNode } from "../../query";

export class RenameTableNode extends QueryNode {
  newName: string;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = false;
  folder = "alter_table";
  file = "rename_table";

  constructor(newName: string) {
    super("rename to");
    this.newName = newName;
  }
}
