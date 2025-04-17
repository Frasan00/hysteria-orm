export type HysteriaErrorCode =
  | "ROW_NOT_FOUND"
  | `UNSUPPORTED_DATABASE_TYPE_${string}`
  | `RELATION_TYPE_NOT_SUPPORTED_${string}`
  | `NOT_SUPPORTED_IN_${string}`
  | `RELATION_NOT_FOUND_IN_MODEL_${string}`
  | `UNKNOWN_RELATION_TYPE_${string}`
  | `DISTINCT_ON_NOT_SUPPORTED_IN_${string}`
  | `CONFLICT_COLUMNS_NOT_PRESENT_IN_DATA`
  | `CONFLICT_COLUMNS_NOT_PRESENT_IN_DATA_${string}`
  | `FOREIGN_KEY_VALUES_MISSING_FOR_HAS_ONE_RELATION_${string}`
  | `FOREIGN_KEY_VALUES_MISSING_FOR_BELONGS_TO_RELATION_${string}`
  | `PRIMARY_KEY_VALUES_MISSING_FOR_HAS_MANY_RELATION_${string}`
  | `MANY_TO_MANY_RELATION_NOT_FOUND_FOR_RELATED_MODEL_${string}`
  | `PRIMARY_KEY_VALUES_MISSING_FOR_MANY_TO_MANY_RELATION_${string}`
  | `RELATED_MODEL_DOES_NOT_HAVE_A_PRIMARY_KEY_${string}`
  | "MODEL_HAS_NO_PRIMARY_KEY"
  | "MUST_CALL_BUILD_CTE_AT_LEAST_ONCE"
  | "REGEXP_NOT_SUPPORTED_IN_SQLITE"
  | "MANY_TO_MANY_RELATION_MUST_HAVE_A_THROUGH_MODEL"
  | "INSERT_FAILED"
  | "MULTIPLE_PRIMARY_KEYS_NOT_ALLOWED"
  | "FILE_NOT_A_SQL_OR_TXT_FILE"
  | "CONNECTION_NOT_ESTABLISHED"
  | "TRANSACTION_NOT_ACTIVE"
  | "DEVELOPMENT_ERROR"
  | "MIGRATION_MODULE_NOT_FOUND"
  | "DRIVER_NOT_FOUND"
  | "FILE_NOT_FOUND_OR_NOT_ACCESSIBLE"
  | "ENV_NOT_SET"
  | "REQUIRED_VALUE_NOT_SET"
  | "SET_FAILED"
  | "GET_FAILED"
  | "REFERENCES_OPTION_REQUIRED"
  | "DELETE_FAILED"
  | "INVALID_DEFAULT_VALUE"
  | "DISCONNECT_FAILED"
  | "FLUSH_FAILED"
  | "MODEL_HAS_NO_PRIMARY_KEY"
  | "GLOBAL_TRANSACTION_ALREADY_STARTED"
  | "GLOBAL_TRANSACTION_NOT_STARTED"
  | "MYSQL_REQUIRES_TABLE_NAME_FOR_INDEX_DROP"
  | "MIGRATION_MODULE_REQUIRES_TS_NODE";
