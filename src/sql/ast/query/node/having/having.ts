import { QueryNode } from "../../query";
import { SqlFuncNode } from "../sqlfunc/sqlfunc";

export type BaseValues = string | number | boolean | null | SqlFuncNode;

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
  | "is null"
  | "is not null"
  | "in"
  | "not in"
  | "between"
  | "not between"
  | "exists"
  | "not exists";

export class HavingNode extends QueryNode {
  column: string;
  isNegated: boolean;
  operator: BinaryOperatorType;
  value: BaseValues | BaseValues[] | undefined;
  /** Subquery used by the in/exists operators. */
  subquery?: string | QueryNode | QueryNode[];
  /** Nested HAVING conditions wrapped in parentheses. */
  group?: HavingNode[];
  chainsWith: "and" | "or" = "and";
  canKeywordBeSeenMultipleTimes = false;
  folder = "having";
  file = "having";

  constructor(
    column: string,
    chainsWith: "and" | "or",
    isNegated: boolean = false,
    operator: BinaryOperatorType,
    value: BaseValues | BaseValues[] | undefined,
    isRawValue: boolean = false,
    subquery?: string | QueryNode | QueryNode[],
    group?: HavingNode[],
  ) {
    super("having", isRawValue);
    this.column = column;
    this.chainsWith = ` ${chainsWith}` as "and" | "or";
    this.isNegated = isNegated;
    this.operator = operator;
    this.value = value;
    this.subquery = subquery;
    this.group = group;
  }
}
