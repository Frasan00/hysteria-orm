import { QueryNode } from "../../query";

export class RenameColumnNode extends QueryNode {
  oldName: string;
  newName: string;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "rename_column";
  constructor(oldName: string, newName: string) {
    super("");
    this.oldName = oldName;
    this.newName = newName;
  }
}
