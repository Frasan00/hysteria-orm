import { QueryNode } from "../../query";

export class OrderByNode extends QueryNode {
  column: string;
  direction: "asc" | "desc";
  chainsWith = ", ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "order_by";
  file = "order_by";

  constructor(
    column: string,
    direction: "asc" | "desc" = "asc",
    isRawValue: boolean = false,
  ) {
    super("order by", isRawValue);
    this.column = column;
    this.direction = direction;
  }
}
