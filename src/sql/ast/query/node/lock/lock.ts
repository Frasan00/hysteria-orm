import { QueryNode } from "../../query";

type LockType =
  | "for_update"
  | "for_share"
  | "for_no_key_update"
  | "for_key_share";

export class LockNode extends QueryNode {
  lockType: LockType;
  skipLocked: boolean;
  noWait: boolean;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "lock";
  file = "lock";

  constructor(
    lockType: LockType,
    skipLocked: boolean = false,
    noWait: boolean = false,
  ) {
    super("lock");
    this.lockType = lockType;
    this.skipLocked = skipLocked;
    this.noWait = noWait;
  }
}
