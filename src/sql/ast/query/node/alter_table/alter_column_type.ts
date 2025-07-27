import { QueryNode } from "../../query";
import { ColumnTypeNode } from "../column";

export class AlterColumnTypeNode extends QueryNode {
  column: string;
  newType: ColumnTypeNode;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "alter_table";
  file = "alter_column_type";
  constructor(column: string, newType: ColumnTypeNode) {
    super("");
    this.column = column;
    this.newType = newType;
  }
}
