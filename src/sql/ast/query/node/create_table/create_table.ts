import { QueryNode } from "../../query";

export class CreateTableNode extends QueryNode {
  table: string;
  children: QueryNode[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "create_table";
  file = "create_table";
  ifNotExists: boolean;

  constructor(
    table: string,
    children: QueryNode[] = [],
    ifNotExists: boolean = false,
  ) {
    super("create table");
    this.table = table;
    this.children = children;
    this.ifNotExists = ifNotExists;
  }
}
