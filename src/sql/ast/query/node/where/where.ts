import { QueryNode } from "../../query";

export type BaseValues = string | number | boolean | undefined | null;

export type BinaryOperatorType =
  | "="
  | "!="
  | "<>"
  | ">"
  | "<"
  | ">="
  | "<="
  | "is"
  | "is not"
  | "like"
  | "not like"
  | "is null"
  | "is not null"
  | "ilike"
  | "in"
  | "not in"
  | "between"
  | "not between"
  | "regexp"
  | "not regexp"
  | "not ilike";

export class WhereNode extends QueryNode {
  column: string;
  isNegated: boolean;
  operator: BinaryOperatorType;
  value: BaseValues | BaseValues[];
  chainsWith: "and" | "or" = "and";
  canKeywordBeSeenMultipleTimes = false;
  folder = "where";
  file = "where";

  constructor(
    column: string,
    chainsWith: "and" | "or",
    isNegated: boolean = false,
    operator: BinaryOperatorType,
    value: BaseValues | BaseValues[],
    isRawValue: boolean = false,
  ) {
    super("where", isRawValue);
    this.column = column;
    this.chainsWith = ` ${chainsWith}` as "and" | "or";
    this.isNegated = isNegated;
    this.operator = operator;
    this.value = value;
  }
}
