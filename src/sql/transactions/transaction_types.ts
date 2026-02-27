import type { Transaction } from "./transaction";

export type TransactionIsolationLevel =
  | "READ UNCOMMITTED"
  | "READ COMMITTED"
  | "REPEATABLE READ"
  | "SERIALIZABLE";

export type StartTransactionOptions = {
  isolationLevel?: TransactionIsolationLevel;
};

/**
 * @description Options for the transaction execution
 */
export type TransactionExecutionOptions = {
  /**
   * @description If true, the transaction will throw an error if it is inactive
   */
  throwErrorOnInactiveTransaction?: boolean;
};

export type TransactionOptionsOrCallback =
  | StartTransactionOptions
  | ((trx: Transaction) => Promise<unknown>);

export type StartTransactionReturnType<T extends TransactionOptionsOrCallback> =
  T extends StartTransactionOptions
    ? Transaction
    : T extends (trx: Transaction) => Promise<infer R>
      ? R
      : Transaction;

/**
 * @description Callback type for nested transactions (no options supported)
 */
export type NestedTransactionCallback = (trx: Transaction) => Promise<unknown>;

/**
 * @description Conditional return type for `nestedTransaction`
 * - With callback: the return type of the callback
 * - Without callback: Transaction
 */
export type NestedTransactionReturnType<
  T extends NestedTransactionCallback | undefined,
> = T extends (trx: Transaction) => Promise<infer R> ? R : Transaction;
