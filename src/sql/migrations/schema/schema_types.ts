export type CommonConstraintOptions = {
  constraintName?: string;
};

export type OnUpdateOrDelete =
  | "cascade"
  | "restrict"
  | "set null"
  | "no action";

export type PrimaryKeyOptions = CommonConstraintOptions;

export type ForeignKeyOptions = CommonConstraintOptions & {
  onDelete?: OnUpdateOrDelete;
  onUpdate?: OnUpdateOrDelete;
};

export type CreateTableContext = "alter_table" | "create_table";

export type CommonPostgresExtensions =
  | "postgis"
  | "uuid-ossp"
  | "hstore"
  | "pg_trgm"
  | "btree_gin"
  | "btree_gist"
  | "citext"
  | "pgcrypto"
  | "tablefunc"
  | "unaccent"
  | "pg_stat_statements"
  | "ltree"
  | "cube"
  | "earthdistance"
  | "fuzzystrmatch"
  | "intarray"
  | "isn"
  | "lo"
  | "pg_buffercache"
  | "pgrowlocks"
  | "pgstattuple"
  | "pg_freespacemap"
  | "postgres_fdw"
  | "seg"
  | "tsm_system_rows"
  | "tsm_system_time"
  | "plpgsql"
  | "plperl"
  | "plpython3u"
  | "pltcl"
  | "adminpack"
  | "amcheck"
  | "autoinc"
  | "bloom"
  | "dict_int"
  | "dict_xsyn"
  | "file_fdw"
  | "insert_username"
  | "intagg"
  | "moddatetime"
  | "old_snapshot"
  | "pageinspect"
  | "pg_prewarm"
  | "pg_surgery"
  | "pg_visibility"
  | "pgaudit"
  | "pglogical"
  | "pgrouting"
  | "postgis_topology"
  | "postgis_raster"
  | "postgis_sfcgal"
  | "postgis_tiger_geocoder"
  | "address_standardizer"
  | "address_standardizer_data_us"
  | "refint"
  | "sslinfo"
  | "tcn"
  | "timescaledb"
  | "vector"
  | "xml2";

/**
 * @description Common MySQL storage engines
 * @mysql only
 */
export type CommonMysqlEngines =
  | "InnoDB"
  | "MyISAM"
  | "MEMORY"
  | "CSV"
  | "ARCHIVE"
  | "BLACKHOLE"
  | "NDB"
  | "FEDERATED";

/**
 * @description Common MySQL character sets
 * @mysql only
 * @description utf8mb4 is recommended for new projects (full UTF-8 support including emojis)
 */
export type CommonMysqlCharsets =
  | "utf8mb4"
  | "utf8"
  | "latin1"
  | "ascii"
  | "binary"
  | "utf16"
  | "utf32"
  | "ucs2";

/**
 * @description Common MySQL collations for utf8mb4 charset
 * @mysql only
 * @description utf8mb4_unicode_ci is recommended for most use cases
 */
export type CommonMysqlUtf8mb4Collations =
  | "utf8mb4_unicode_ci"
  | "utf8mb4_general_ci"
  | "utf8mb4_bin"
  | "utf8mb4_0900_ai_ci"
  | "utf8mb4_0900_as_ci";

/**
 * @description Common MySQL collations for utf8 (legacy) charset
 * @mysql only
 * @description Note: utf8 is deprecated, use utf8mb4 instead
 */
export type CommonMysqlUtf8Collations =
  | "utf8_unicode_ci"
  | "utf8_general_ci"
  | "utf8_bin";

/**
 * @description Common MySQL collations for latin1 charset
 * @mysql only
 * @description latin1_swedish_ci is the default for latin1
 */
export type CommonMysqlLatin1Collations =
  | "latin1_swedish_ci"
  | "latin1_general_ci"
  | "latin1_general_cs"
  | "latin1_bin";

/**
 * @description Common MySQL collations for ascii charset
 * @mysql only
 */
export type CommonMysqlAsciiCollations = "ascii_general_ci" | "ascii_bin";

/**
 * @description All common MySQL collations (all charsets)
 * @mysql only
 */
export type CommonMysqlCollations =
  | CommonMysqlUtf8mb4Collations
  | CommonMysqlUtf8Collations
  | CommonMysqlLatin1Collations
  | CommonMysqlAsciiCollations;

/**
 * @description MySQL-specific table options
 * @mysql only
 */
export type MysqlTableOptions = {
  engine?: CommonMysqlEngines | (string & {});
  charset?: CommonMysqlCharsets | (string & {});
  collate?: CommonMysqlCollations | (string & {});
};

/**
 * @description MySQL-specific column options
 * @mysql only
 */
export type MysqlColumnOptions = {
  collate?: CommonMysqlCollations | string;
};

/**
 * @description Additional MySQL/MariaDB table options beyond engine/charset/collate
 * @mysql only
 */
export type MysqlAdvancedTableOptions = {
  rowFormat?:
    | "DEFAULT"
    | "DYNAMIC"
    | "COMPRESSED"
    | "REDUNDANT"
    | "COMPACT"
    | "FIXED";
  autoIncrement?: number;
  dataDirectory?: string;
  indexDirectory?: string;
  maxRows?: number;
  minRows?: number;
  checksum?: boolean;
  encrypted?: boolean;
  comment?: string;
};

/**
 * @description PostgreSQL-specific table options
 * @postgres only
 */
export type PostgresTableOptions = {
  tablespace?: string;
  unlogged?: boolean;
  temporary?: boolean;
  with?: Record<string, string | number | boolean>;
};

/**
 * @description SQLite-specific table options
 * @sqlite only
 */
export type SqliteTableOptions = {
  strict?: boolean;
  withoutRowId?: boolean;
  temporary?: boolean;
};

/**
 * @description MSSQL-specific table options
 * @mssql only
 */
export type MssqlTableOptions = {
  onFilegroup?: string;
  textImageOn?: string;
  dataCompression?:
    | "NONE"
    | "ROW"
    | "PAGE"
    | "COLUMNSTORE"
    | "COLUMNSTORE_ARCHIVE";
};

/**
 * @description OracleDB-specific table options
 * @oracledb only
 */
export type OracledbTableOptions = {
  tablespace?: string;
  compress?: boolean;
  storage?: {
    initial?: string;
    next?: string;
    minextents?: number;
    maxextents?: string;
    pctincrease?: number;
    pctfree?: number;
    pctused?: number;
  };
  logging?: boolean;
  cache?: boolean;
  inMemory?: boolean;
  compressFor?: "QUERY LOW" | "QUERY HIGH" | "ARCHIVE LOW" | "ARCHIVE HIGH";
};

export type DateTimeOptions = {
  /**
   * @description Whether to include the timezone in the datetime column
   */
  withTimezone?: boolean;
  /**
   * @description The precision of the datetime column
   */
  precision?: number;
  /**
   * @description Sets DEFAULT CURRENT_TIMESTAMP on the column
   */
  autoCreate?: boolean;
  /**
   * @description Automatically updates the column on row update. Uses ON UPDATE CURRENT_TIMESTAMP on MySQL/MariaDB, auto-generates a trigger on other databases
   */
  autoUpdate?: boolean;
};

/**
 * @description Union type for all database-specific table options
 */
export type DatabaseTableOptions =
  | MysqlTableOptions
  | PostgresTableOptions
  | SqliteTableOptions
  | MssqlTableOptions
  | OracledbTableOptions
  | MysqlAdvancedTableOptions;
