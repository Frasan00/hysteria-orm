import { JsonPathInput } from "../../../../../utils/json_path_utils";
import { QueryNode } from "../../query";

export type JsonSelectOperatorType =
  | "extract" // Extract JSON value at path
  | "extract_text" // Extract JSON value as text
  | "array_length" // Get array length
  | "object_keys" // Get object keys
  | "raw"; // Raw JSON expression

export class SelectJsonNode extends QueryNode {
  column: string;
  jsonPath: JsonPathInput;
  alias?: string;
  jsonOperator: JsonSelectOperatorType;
  folder = "select";
  file = "select_json";
  chainsWith = ", ";
  canKeywordBeSeenMultipleTimes = false;

  constructor(
    column: string,
    jsonPath: JsonPathInput,
    alias?: string,
    operator: JsonSelectOperatorType = "extract",
    isRawValue: boolean = false,
  ) {
    super("select");
    this.column = column;
    this.jsonPath = jsonPath;
    this.alias = alias;
    this.jsonOperator = operator;
    this.isRawValue = isRawValue;
  }
}
