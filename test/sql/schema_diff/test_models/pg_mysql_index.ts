// New PG/MySQL/MariaDB focused test fixtures
export { BinaryColumnsV1, BinaryColumnsV2 } from "./pg_mysql/binary_columns";

export {
  CharTinySmallMediumV1,
  CharTinySmallMediumV2,
} from "./pg_mysql/char_tiny_small_medium";

export {
  EncryptionColumnsV1,
  EncryptionColumnsV2,
} from "./pg_mysql/encryption_columns";

export { NativeEnumV1, NativeEnumV2 } from "./pg_mysql/native_enum";

export {
  DatetimeTimestampTimeV1,
  DatetimeTimestampTimeV2,
} from "./pg_mysql/datetime_timestamp_time";

export {
  CaseConventionsV1,
  CaseConventionsV2,
} from "./pg_mysql/case_conventions";

export {
  UnsignedCombosV1,
  UnsignedCombosV2,
} from "./pg_mysql/unsigned_combinations";

export {
  DualIndexUniqueV1,
  DualIndexUniqueV2,
  DualIndexUniqueV3,
} from "./pg_mysql/dual_index_unique";

export { LongStringPkV1, LongStringPkV2 } from "./pg_mysql/long_string_pk";

export {
  MultiTableDdlAnchor,
  MultiTableDdlCascade,
  MultiTableDdlCascadeRelations,
  MultiTableDdlNoAction,
  MultiTableDdlNoActionRelations,
  MultiTableDdlRestrict,
  MultiTableDdlRestrictRelations,
  MultiTableDdlSetNull,
  MultiTableDdlSetNullRelations,
} from "./pg_mysql/multi_table_ddl";
