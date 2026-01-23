import { QueryNode } from "../../query";

export class SetTableOptionsNode extends QueryNode {
  engine?: string;
  charset?: string;
  collate?: string;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = false;
  folder = "alter_table";
  file = "set_table_options";

  constructor(options: {
    engine?: string;
    charset?: string;
    collate?: string;
  }) {
    super("");
    this.engine = options.engine;
    this.charset = options.charset;
    this.collate = options.collate;
  }
}
