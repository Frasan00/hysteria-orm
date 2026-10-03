import type { JsonPathInput } from "../../../../../utils/json_path_utils";
import type { BinaryOperatorType } from "./where";
import { WhereNode } from "./where";

export type JsonOperatorType =
  | "=" // Exact equality (whole JSON value / object)
  | "!=" // Not equal
  | "contains" // JSON contains (superset)
  | "not contains" // JSON doesn't contain
  | "subset" // JSON is contained by the value
  | "path" // Compare the value at a JSON path
  | "has none" // None of the given keys are present
  | "raw"; // Raw JSON expression

export class WhereJsonNode extends WhereNode {
  value: any[];
  jsonOperator: JsonOperatorType;
  /** JSON path used by the "path" operator. */
  path?: JsonPathInput;
  /** Comparison operator used by the "path" operator. */
  comparisonOperator?: BinaryOperatorType;
  file = "where_json";

  constructor(
    column: string,
    chainsWith: "and" | "or",
    isNegated: boolean = false,
    operator: JsonOperatorType,
    value: any[],
    isRawValue: boolean = false,
    path?: JsonPathInput,
    comparisonOperator?: BinaryOperatorType,
  ) {
    // Use the basic operator from WhereNode, but we'll override it in interpreters
    super(column, chainsWith, isNegated, "=", value, isRawValue);
    this.jsonOperator = operator;
    this.value = value;
    this.path = path;
    this.comparisonOperator = comparisonOperator;
  }
}
