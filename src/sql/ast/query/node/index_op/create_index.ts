import { QueryNode } from "../../query";

export class CreateIndexNode extends QueryNode {
  table: string;
  columns: string[];
  indexName: string;
  unique: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "index_op";
  file = "create_index";

  constructor(
    table: string,
    columns: string[],
    indexName: string,
    unique = false,
  ) {
    super("create index");
    this.table = table;
    this.columns = columns;
    this.indexName = indexName;
    this.unique = unique;
  }
}
