import { QueryNode } from "../../query";

export type WindowFunctionName = "rank" | "dense_rank" | "row_number";

export type WindowDirection = "asc" | "desc";

export interface WindowOrder {
  column: string;
  order?: WindowDirection;
}

/** ORDER BY input: a column, a { column, order } object, or an array of either. */
export type WindowOrderInput = string | WindowOrder | (string | WindowOrder)[];

/** PARTITION BY input: a column or an array of columns. */
export type WindowPartitionInput = string | string[];

/** Options for `rank`/`denseRank`/`rowNumber`. */
export interface WindowOptions {
  partitionBy?: WindowPartitionInput;
  orderBy?: WindowOrderInput;
}

/**
 * @description A window (analytic) function call: `fn() OVER (PARTITION BY ...
 * ORDER BY ...)`. `rank`/`dense_rank`/`row_number` are the supported names.
 */
export class WindowFunctionNode extends QueryNode {
  fn: WindowFunctionName;
  partitionBy: string[];
  orderBy: WindowOrder[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "window";
  file = "window";

  constructor(
    fn: WindowFunctionName,
    partitionBy: string[] = [],
    orderBy: WindowOrder[] = [],
  ) {
    super("window");
    this.fn = fn;
    this.partitionBy = partitionBy;
    this.orderBy = orderBy;
  }
}

export function normalizeWindowPartition(
  input?: WindowPartitionInput,
): string[] {
  if (!input) {
    return [];
  }
  return Array.isArray(input) ? input : [input];
}

export function normalizeWindowOrder(input?: WindowOrderInput): WindowOrder[] {
  if (!input) {
    return [];
  }
  const items = Array.isArray(input) ? input : [input];
  return items.map((item) =>
    typeof item === "string" ? { column: item } : item,
  );
}
