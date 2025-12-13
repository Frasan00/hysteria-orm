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
