import { HysteriaError } from "../../errors/hysteria_error";
import type { AstParser } from "../ast/parser";
import { RawNode } from "../ast/query/node/raw/raw_node";
import type { WhereOnlyQueryBuilder } from "./query_builder_types";
import { WriteOperation } from "./write_operation";

export type InsertConflictMode = "update" | "ignore";

export type InsertConflictConfig = {
  conflictColumns: string[];
  mode: InsertConflictMode;
  columnsToUpdate: string[];
  /** Raw conflict target, e.g. `(lower(email)) where deleted_at is null`. */
  conflictTargetRaw?: string;
  /** Named unique constraint to conflict on. */
  conflictConstraint?: string;
  /** Builds the `WHERE` of a `do update` clause. */
  mergeWhere?: (qb: WhereOnlyQueryBuilder<any>) => void;
};

type ConflictState = {
  requested: boolean;
  actionProvided: boolean;
};

/** Conflict targets must be bare: Postgres and SQLite reject table-qualified columns. */
const bareColumn = (column: string): string => {
  const separator = column.lastIndexOf(".");
  return separator === -1 ? column : column.slice(separator + 1);
};

/**
 * @description A WriteOperation for inserts that can be given a conflict action
 * (`onConflict(...).merge()` or `.ignore()`) before it is awaited.
 */
export class InsertWriteOperation<
  T,
  K extends string = string,
> extends WriteOperation<T> {
  private conflictState: ConflictState;
  private conflictColumns: string[] | null = null;
  private conflictTargetRaw: string | null = null;
  private conflictConstraint: string | null = null;
  private readonly commit: (config: InsertConflictConfig) => void;
  private readonly insertColumns: readonly string[];
  private readonly caller: string;

  constructor(
    unWrapFn: () => ReturnType<typeof AstParser.prototype.parse>,
    toSqlFn: () => ReturnType<typeof AstParser.prototype.parse>,
    toQueryFn: () => string,
    executor: () => Promise<T>,
    commit: (config: InsertConflictConfig) => void,
    insertColumns: readonly string[],
    caller: string,
  ) {
    const conflictState: ConflictState = {
      requested: false,
      actionProvided: false,
    };

    // async so a missing action rejects through then()/catch() instead of throwing
    // synchronously out of them
    super(unWrapFn, toSqlFn, toQueryFn, async () => {
      if (conflictState.requested && !conflictState.actionProvided) {
        throw new HysteriaError(caller, "ON_CONFLICT_REQUIRES_MERGE_OR_IGNORE");
      }
      return executor();
    });

    this.conflictState = conflictState;
    this.commit = commit;
    this.insertColumns = insertColumns.map(bareColumn);
    this.caller = caller;
  }

  /**
   * @description Sets the conflict target: column(s), a raw expression such as an
   * index predicate, or a named constraint
   * @description With no arguments the conflict has no explicit target, which is
   * only valid with `ignore()`
   * @description Must be followed by `merge()` or `ignore()`
   */
  onConflict(): this;
  onConflict(column: K): this;
  onConflict(columns: K[]): this;
  onConflict(target: RawNode): this;
  onConflict(options: { constraint: string }): this;
  onConflict(
    columnOrColumns?: K | K[] | RawNode | { constraint: string },
  ): this {
    if (columnOrColumns === undefined) {
      this.conflictColumns = [];
      this.conflictState.requested = true;
      return this;
    }

    if (columnOrColumns instanceof RawNode) {
      this.conflictTargetRaw = columnOrColumns.rawValue;
      this.conflictColumns = [];
      this.conflictState.requested = true;
      return this;
    }

    if (
      !Array.isArray(columnOrColumns) &&
      typeof columnOrColumns === "object"
    ) {
      const constraint = (columnOrColumns as { constraint?: string })
        .constraint;
      if (!constraint) {
        throw new HysteriaError(this.caller, "ON_CONFLICT_COLUMNS_REQUIRED");
      }
      this.conflictConstraint = constraint;
      this.conflictColumns = [];
      this.conflictState.requested = true;
      return this;
    }

    const columns = (
      Array.isArray(columnOrColumns) ? columnOrColumns : [columnOrColumns]
    ).map(bareColumn);

    if (!columns.length) {
      throw new HysteriaError(this.caller, "ON_CONFLICT_COLUMNS_REQUIRED");
    }

    this.conflictColumns = columns;
    this.conflictState.requested = true;
    return this;
  }

  /**
   * @description Updates the inserted columns when the conflict target already exists
   * @description Without arguments every inserted column except the conflict target is updated
   * @description Pass `{ where }` to guard the update, PostgreSQL and SQLite only
   * @throws HysteriaError if nothing is left to update, use `ignore()` instead
   */
  merge(): this;
  merge(column: K): this;
  merge(columns: K[]): this;
  merge(options: {
    columns?: K[];
    where?: (qb: WhereOnlyQueryBuilder<any>) => void;
  }): this;
  merge(
    columnOrColumnsOrOptions?:
      | K
      | K[]
      | { columns?: K[]; where?: (qb: WhereOnlyQueryBuilder<any>) => void },
  ): this {
    const conflictColumns = this.requireConflictTarget("merge");
    const options =
      columnOrColumnsOrOptions !== null &&
      typeof columnOrColumnsOrOptions === "object" &&
      !Array.isArray(columnOrColumnsOrOptions)
        ? columnOrColumnsOrOptions
        : undefined;
    const requestedColumns = options
      ? options.columns
      : (columnOrColumnsOrOptions as K | K[] | undefined);

    const columnsToUpdate =
      requestedColumns === undefined
        ? this.insertColumns.filter(
            (column) => !conflictColumns.includes(column),
          )
        : (Array.isArray(requestedColumns)
            ? requestedColumns
            : [requestedColumns]
          ).map(bareColumn);

    // `do update set` with nothing after it is invalid SQL, so the empty list has to
    // fail here rather than at the database
    if (!columnsToUpdate.length) {
      throw new HysteriaError(
        `${this.caller}::merge`,
        "MERGE_REQUIRES_COLUMNS",
      );
    }

    this.commitConflict(conflictColumns, "update", columnsToUpdate, {
      conflictTargetRaw: this.conflictTargetRaw ?? undefined,
      conflictConstraint: this.conflictConstraint ?? undefined,
      mergeWhere: options?.where,
    });
    return this;
  }

  /**
   * @description Leaves the existing row untouched when the conflict target already exists
   * @description Works with or without an explicit conflict target
   */
  ignore(): this {
    if (!this.conflictState.requested) {
      throw new HysteriaError(
        `${this.caller}::ignore`,
        "MERGE_REQUIRES_ON_CONFLICT",
      );
    }

    this.conflictState.actionProvided = true;
    this.commitConflict(this.conflictColumns ?? [], "ignore", [], {
      conflictTargetRaw: this.conflictTargetRaw ?? undefined,
      conflictConstraint: this.conflictConstraint ?? undefined,
    });
    return this;
  }

  private requireConflictTarget(method: string): string[] {
    const hasTarget =
      !!this.conflictColumns?.length ||
      !!this.conflictTargetRaw ||
      !!this.conflictConstraint;

    if (!hasTarget) {
      throw new HysteriaError(
        `${this.caller}::${method}`,
        "MERGE_REQUIRES_ON_CONFLICT",
      );
    }

    return this.conflictColumns ?? [];
  }

  private commitConflict(
    conflictColumns: string[],
    mode: InsertConflictMode,
    columnsToUpdate: string[],
    extra: Omit<
      InsertConflictConfig,
      "conflictColumns" | "mode" | "columnsToUpdate"
    >,
  ): void {
    this.conflictState.actionProvided = true;
    this.commit({ conflictColumns, mode, columnsToUpdate, ...extra });
  }
}
