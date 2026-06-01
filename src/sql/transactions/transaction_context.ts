import { AsyncLocalStorage } from "node:async_hooks";
import type { Transaction } from "./transaction";

/**
 * AsyncLocalStorage wrapper for propagating Transaction instances
 * through async call chains. Used exclusively by SqlDataSource
 * callback-style transactions.
 */
export class TransactionContext {
  private constructor() {}

  private static readonly storage = new AsyncLocalStorage<Transaction>();

  static run<T>(
    transaction: Transaction,
    callback: () => Promise<T>,
  ): Promise<T> {
    return TransactionContext.storage.run(transaction, callback);
  }

  static getTransaction(): Transaction | undefined {
    return TransactionContext.storage.getStore();
  }
}
