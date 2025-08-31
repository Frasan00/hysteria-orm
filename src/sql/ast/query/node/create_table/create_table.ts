import { QueryNode } from "../../query";
import { ConstraintNode } from "../constraint";

export class CreateTableNode extends QueryNode {
  table: string;
  children: QueryNode[];
  namedConstraints: ConstraintNode[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "create_table";
  file = "create_table";
  ifNotExists: boolean;

  constructor(
    table: string,
    children: QueryNode[] = [],
    namedConstraints: ConstraintNode[] = [],
    ifNotExists: boolean = false,
  ) {
    super("create table");
    this.table = table;
    this.children = children;
    this.namedConstraints = namedConstraints;
    this.ifNotExists = ifNotExists;
  }
}
