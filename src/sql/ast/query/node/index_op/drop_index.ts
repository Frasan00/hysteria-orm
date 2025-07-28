import { QueryNode } from "../../query";

export class DropIndexNode extends QueryNode {
  indexName: string;
  table?: string; // required for mysql
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "index_op";
  file = "drop_index";

  constructor(indexName: string, table?: string) {
    super("drop index");
    this.indexName = indexName;
    this.table = table;
  }
}
