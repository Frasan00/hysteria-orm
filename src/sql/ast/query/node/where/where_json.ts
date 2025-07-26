import { WhereNode } from "./where";

export type JsonOperatorType =
  | "=" // Basic equality
  | "!=" // Not equal
  | "contains" // JSON contains
  | "not contains" // JSON doesn't contain
  | "raw"; // Raw JSON expression

export class WhereJsonNode extends WhereNode {
  value: any[];
  jsonOperator: JsonOperatorType;
  file = "where_json";

  constructor(
    column: string,
    chainsWith: "and" | "or",
    isNegated: boolean = false,
    operator: JsonOperatorType,
    value: any[],
    isRawValue: boolean = false,
  ) {
    // Use the basic operator from WhereNode, but we'll override it in interpreters
    super(column, chainsWith, isNegated, "=", value as any, isRawValue);
    this.jsonOperator = operator;
    this.value = value;
  }
}
