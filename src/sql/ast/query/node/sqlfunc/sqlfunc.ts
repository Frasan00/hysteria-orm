import type { SqlDataSourceType } from "../../../../sql_data_source_types";
import { QueryNode } from "../../query";
import { RawNode } from "../raw/raw_node";

export type SqlFuncToken = "$uuid" | "$now" | "$currentTimestamp";

/**
 * @description Expression node for the global `sqlFunc` token namespace.
 * @internal
 */
export class SqlFuncNode extends QueryNode {
  fn: string;
  args: (string | number | SqlFuncNode | RawNode)[];
  chainsWith = ", ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "sqlfunc";
  file = "sqlfunc";

  constructor(
    fn: string,
    args: (string | number | SqlFuncNode | RawNode)[] = [],
  ) {
    super("sqlfunc");
    this.fn = fn;
    this.args = args;
  }
}

export const sqlFunc = {
  uuid: () => new SqlFuncNode("$uuid"),
  now: () => new SqlFuncNode("$now"),
  currentTimestamp: () => new SqlFuncNode("$currentTimestamp"),
};

/**
 * @description Renders a `SqlFuncNode` to dialect SQL. Return `undefined` to
 * fall back to the built-in tokens for the remaining function names.
 */
export type SqlFuncRenderer = (node: SqlFuncNode) => string | undefined;

const sqlFuncRenderers = new Map<string, SqlFuncRenderer>();

/**
 * @description Registers a custom renderer for a dialect, or for every dialect
 * via `"*"`. A dialect-specific renderer wins over the `"*"` entry, which wins
 * over the built-in tokens.
 * @example
 * ```ts
 * registerSqlFuncRenderer("postgres", (node) =>
 *   node.fn === "$tenant" ? "current_setting('app.tenant')" : undefined,
 * );
 * ```
 */
export function registerSqlFuncRenderer(
  dialect: SqlDataSourceType | "*",
  renderer: SqlFuncRenderer,
): void {
  sqlFuncRenderers.set(dialect, renderer);
}

/**
 * @description Resolves a custom render for a node, trying the dialect-specific
 * renderer first, then the `"*"` renderer. Returns `undefined` when neither
 * handles the node, so the caller falls back to the built-in tokens.
 */
export function renderCustomSqlFunc(
  dialect: SqlDataSourceType | undefined,
  node: SqlFuncNode,
): string | undefined {
  const dialectRenderer =
    dialect === undefined ? undefined : sqlFuncRenderers.get(dialect);
  const globalRenderer = sqlFuncRenderers.get("*");

  return dialectRenderer?.(node) ?? globalRenderer?.(node);
}
