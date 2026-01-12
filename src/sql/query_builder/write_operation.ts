import type { AstParser } from "../ast/parser";

/**
 * A PromiseLike wrapper for write operations that allows SQL inspection without execution.
 * The operation is only executed when awaited (via `then()`).
 *
 * @example
 * ```ts
 * // Get SQL without executing
 * const sql = sql.query("users").insert({ name: "John" }).toQuery();
 *
 * // Execute the operation
 * const result = await sql.query("users").insert({ name: "John" });
 * ```
 */
export class WriteOperation<T> implements PromiseLike<T> {
  readonly [Symbol.toStringTag] = "WriteOperation";

  constructor(
    private unWrapFn: () => ReturnType<typeof AstParser.prototype.parse>,
    private toQueryFn: () => string,
    private executor: () => Promise<T>,
  ) {}

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): Promise<TResult1 | TResult2> {
    return this.executor().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | null
      | undefined,
  ): Promise<T | TResult> {
    return this.executor().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null | undefined): Promise<T> {
    return this.executor().finally(onfinally);
  }

  /**
   * @description Returns the query with the parameters bound to the query
   * @warning Does not apply any hook from the model
   */
  toQuery(): string {
    return this.toQueryFn();
  }

  /**
   * @description Returns the query with database driver placeholders and the params
   * @warning Does not apply any hook from the model
   */
  unWrap(): ReturnType<typeof AstParser.prototype.parse> {
    return this.unWrapFn();
  }
}
