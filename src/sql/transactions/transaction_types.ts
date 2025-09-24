import { SqlDriverSpecificOptions } from "../sql_data_source_types";

export type TransactionIsolationLevel =
  | "READ UNCOMMITTED"
  | "READ COMMITTED"
  | "REPEATABLE READ"
  | "SERIALIZABLE";

export type StartTransactionOptions = {
  driverSpecificOptions?: SqlDriverSpecificOptions;
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
