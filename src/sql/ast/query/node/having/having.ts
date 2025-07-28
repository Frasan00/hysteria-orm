import { QueryNode } from "../../query";

export type BaseValues = string | number | boolean | null;

export type BinaryOperatorType =
  | "="
  | "!="
  | "<>"
  | ">"
  | "<"
  | ">="
  | "<="
  | "like"
  | "ilike"
  | "in";

export class HavingNode extends QueryNode {
  column: string;
  isNegated: boolean;
  operator: BinaryOperatorType;
  value: BaseValues | BaseValues[];
  chainsWith: "and" | "or" = "and";
  canKeywordBeSeenMultipleTimes = false;
  folder = "having";
  file = "having";

  constructor(
    column: string,
    chainsWith: "and" | "or",
    isNegated: boolean = false,
    operator: BinaryOperatorType,
    value: BaseValues | BaseValues[],
    isRawValue: boolean = false,
  ) {
    super("having", isRawValue);
    this.column = column;
    this.chainsWith = `${chainsWith} ` as "and" | "or";
    this.isNegated = isNegated;
    this.operator = operator;
    this.value = value;
  }
}
