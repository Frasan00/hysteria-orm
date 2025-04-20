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

export type TransactionExecutionOptions = {
  throwErrorOnInactiveTransaction?: boolean;
};
