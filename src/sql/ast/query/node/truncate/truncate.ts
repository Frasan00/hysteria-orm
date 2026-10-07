import { QueryNode } from "../../query";
import { FromNode } from "../from";

export type TruncateOptions = {
  cascade?: boolean;
  restartIdentity?: boolean;
  continueIdentity?: boolean;
};

export class TruncateNode extends QueryNode {
  fromNode: FromNode | string;
  options?: TruncateOptions;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "truncate";
  file = "truncate";

  constructor(
    fromNode: FromNode | string,
    isRawValue: boolean = false,
    options?: TruncateOptions,
  ) {
    super("truncate", isRawValue);
    this.fromNode = fromNode;
    this.options = options;
  }
}
