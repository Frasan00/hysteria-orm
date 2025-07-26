export abstract class QueryNode {
  /**
   * Sql keyword to use for the query e.g. "select"
   */
  keyword: string;

  /**
   * The current parameter index to use for the query
   */
  currParamIndex: number = 1;

  /**
   * Whether the query node is a raw value and should not be parsed by the interpreter
   */
  isRawValue: boolean = false;

  /**
   * Whether the keyword can be seen multiple times in the query, e.g. "join" can be seen multiple times in a query
   */
  abstract canKeywordBeSeenMultipleTimes: boolean;

  /**
   * The string to use to chain the keyword with the next keyword
   */
  abstract chainsWith: string;

  /**
   * The folder to use for the query node, e.g. "select" is in the "select" folder inside the interpreter map
   */
  abstract folder: string;

  /**
   * The file to use for the query node, e.g. "select" is in the "select" file inside the interpreter map
   */
  abstract file: string;

  constructor(keyword: string, isRawValue: boolean = false) {
    this.keyword = keyword;
    this.isRawValue = isRawValue;
  }
}
