import { HysteriaError } from "../../errors/hysteria_error";
import type { AstParser } from "../ast/parser";
import { WriteOperation } from "./write_operation";

export type InsertConflictMode = "update" | "ignore";

export type InsertConflictConfig = {
  conflictColumns: string[];
  mode: InsertConflictMode;
  columnsToUpdate: string[];
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
   * @description Sets the column(s) that identify a conflict
   * @description With no arguments the conflict has no explicit target, which is
   * only valid with `ignore()`
   * @description Must be followed by `merge()` or `ignore()`
   */
  onConflict(): this;
  onConflict(column: K): this;
  onConflict(columns: K[]): this;
  onConflict(columnOrColumns?: K | K[]): this {
    if (columnOrColumns === undefined) {
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
   */
  merge(): this;
  merge(column: K): this;
  merge(columns: K[]): this;
  merge(columnOrColumns?: K | K[]): this {
    const conflictColumns = this.requireConflictTarget("merge");
    const columnsToUpdate =
      columnOrColumns === undefined
        ? this.insertColumns.filter(
            (column) => !conflictColumns.includes(column),
          )
        : (Array.isArray(columnOrColumns)
            ? columnOrColumns
            : [columnOrColumns]
          ).map(bareColumn);

    this.commitConflict(conflictColumns, "update", columnsToUpdate);
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
    this.commitConflict(this.conflictColumns ?? [], "ignore", []);
    return this;
  }

  private requireConflictTarget(method: string): string[] {
    if (!this.conflictColumns?.length) {
      throw new HysteriaError(
        `${this.caller}::${method}`,
        "MERGE_REQUIRES_ON_CONFLICT",
      );
    }

    return this.conflictColumns;
  }

  private commitConflict(
    conflictColumns: string[],
    mode: InsertConflictMode,
    columnsToUpdate: string[],
  ): void {
    this.conflictState.actionProvided = true;
    this.commit({ conflictColumns, mode, columnsToUpdate });
  }
}
