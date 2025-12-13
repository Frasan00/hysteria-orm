import { QueryNode } from "../../query";

export class CreateExtensionNode extends QueryNode {
  extensionName: string;
  ifNotExists: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "extension";
  file = "create_extension";

  constructor(extensionName: string, ifNotExists: boolean = true) {
    super("create extension");
    this.extensionName = extensionName;
    this.ifNotExists = ifNotExists;
  }
}
