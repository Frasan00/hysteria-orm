import { RelationEnum } from "../relations/relation";
import type { RelationLoadStrategy } from "./model_query_builder_types";

/**
 * Context for strategy detection
 */
export interface StrategyContext {
  /** Number of parent models being loaded, or 'unknown' if not determinable */
  parentCount: number | "unknown";
  /** Type of relation being loaded */
  relationType: RelationEnum;
  /** Whether the relation query has limit/offset */
  hasLimitOffset: boolean;
  /** Whether the relation query has orderBy */
  hasOrderBy: boolean;
}

/**
 * Determines the optimal relation loading strategy based on query context.
 *
 * @param context - Query context including parent count and relation type
 * @param options - User-provided options (may override auto-detection)
 * @returns The determined strategy ('join' or 'batched')
 *
 * @remarks
 * Strategy selection rules:
 * 1. Explicit strategy override always wins (except 'auto')
 * 2. Single parent → JOIN (best performance, no N+1 risk)
 * 3. ManyToMany with small parent set → JOIN (nested loop join)
 * 4. Small parent set (<10) → JOIN
 * 5. HasMany with limit/offset → BATCHED (correctness over performance)
 * 6. Large parent set → BATCHED (scalability)
 */
export function determineRelationStrategy(
  context: StrategyContext,
  options: { strategy?: RelationLoadStrategy },
): ResolvedRelationLoadStrategy {
  if (options.strategy && options.strategy !== "auto") {
    return options.strategy;
  }

  return selectAutoStrategy(context);
}

/**
 * Automatic strategy selection based on query characteristics
 */
function selectAutoStrategy(
  context: StrategyContext,
): ResolvedRelationLoadStrategy {
  const { parentCount, relationType, hasLimitOffset } = context;

  // RULE 1: HasMany with limit/offset → BATCHED (JOIN gives wrong row counts)
  if (
    hasLimitOffset &&
    (relationType === RelationEnum.hasMany ||
      relationType === RelationEnum.manyToMany)
  ) {
    return "batched";
  }

  // RULE 2: Single parent → JOIN (best performance, no N+1 risk)
  if (parentCount === 1) {
    return "join";
  }

  // RULE 3: ManyToMany with small parent set → JOIN (nested loop join)
  if (relationType === RelationEnum.manyToMany) {
    if (typeof parentCount === "number" && parentCount <= 10) {
      return "join";
    }
    return "batched";
  }

  // RULE 4: Small parent set (<10) → JOIN
  if (typeof parentCount === "number" && parentCount < 10) {
    return "join";
  }

  // DEFAULT: Batched (scalability)
  return "batched";
}

/**
 * RelationLoadStrategy type for internal use (excludes 'auto' which is only for options)
 */
export type ResolvedRelationLoadStrategy = "join" | "batched";
