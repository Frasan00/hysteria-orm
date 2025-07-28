import { QueryNode } from "../../query";

export class AlterTableNode extends QueryNode {
  table: string;
  children: QueryNode[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "alter_table";
  file = "alter_table";
  ifExists: boolean;

  constructor(
    table: string,
    children: QueryNode[] = [],
    ifExists: boolean = false,
  ) {
    super("alter table");
    this.table = table;
    this.children = children;
    this.ifExists = ifExists;
  }
}
