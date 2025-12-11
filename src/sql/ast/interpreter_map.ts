import mssql_alter_table_add_column from '../interpreter/mssql/alter_table/add_column';
import mssql_alter_table_add_constraint from '../interpreter/mssql/alter_table/add_constraint';
import mssql_alter_table_add_primary_key from '../interpreter/mssql/alter_table/add_primary_key';
import mssql_alter_table_alter_column_type from '../interpreter/mssql/alter_table/alter_column_type';
import mssql_alter_table_alter_table from '../interpreter/mssql/alter_table/alter_table';
import mssql_alter_table_drop_column from '../interpreter/mssql/alter_table/drop_column';
import mssql_alter_table_drop_constraint from '../interpreter/mssql/alter_table/drop_constraint';
import mssql_alter_table_drop_default from '../interpreter/mssql/alter_table/drop_default';
import mssql_alter_table_drop_not_null from '../interpreter/mssql/alter_table/drop_not_null';
import mssql_alter_table_drop_primary_key from '../interpreter/mssql/alter_table/drop_primary_key';
import mssql_alter_table_rename_column from '../interpreter/mssql/alter_table/rename_column';
import mssql_alter_table_rename_table from '../interpreter/mssql/alter_table/rename_table';
import mssql_alter_table_set_default from '../interpreter/mssql/alter_table/set_default';
import mssql_alter_table_set_not_null from '../interpreter/mssql/alter_table/set_not_null';
import mssql_column_column_type from '../interpreter/mssql/column/column_type';
import mssql_constraint_after from '../interpreter/mssql/constraint/after';
import mssql_constraint_constraint from '../interpreter/mssql/constraint/constraint';
import mssql_create_table_create_table from '../interpreter/mssql/create_table/create_table';
import mssql_delete_delete from '../interpreter/mssql/delete/delete';
import mssql_distinct_distinct from '../interpreter/mssql/distinct/distinct';
import mssql_distinct_distinct_on from '../interpreter/mssql/distinct/distinct_on';
import mssql_drop_table_drop_table from '../interpreter/mssql/drop_table/drop_table';
import mssql_from_from from '../interpreter/mssql/from/from';
import mssql_group_by_group_by from '../interpreter/mssql/group_by/group_by';
import mssql_having_having from '../interpreter/mssql/having/having';
import mssql_index_op_create_index from '../interpreter/mssql/index_op/create_index';
import mssql_index_op_drop_index from '../interpreter/mssql/index_op/drop_index';
import mssql_insert_insert from '../interpreter/mssql/insert/insert';
import mssql_join_join from '../interpreter/mssql/join/join';
import mssql_limit_limit from '../interpreter/mssql/limit/limit';
import mssql_lock_lock from '../interpreter/mssql/lock/lock';
import mssql_offset_offset from '../interpreter/mssql/offset/offset';
import mssql_on_duplicate_on_duplicate from '../interpreter/mssql/on_duplicate/on_duplicate';
import mssql_order_by_order_by from '../interpreter/mssql/order_by/order_by';
import mssql_raw_raw from '../interpreter/mssql/raw/raw';
import mssql_schema_foreign_key_info from '../interpreter/mssql/schema/foreign_key_info';
import mssql_schema_index_info from '../interpreter/mssql/schema/index_info';
import mssql_schema_primary_key_info from '../interpreter/mssql/schema/primary_key_info';
import mssql_schema_table_info from '../interpreter/mssql/schema/table_info';
import mssql_select_select from '../interpreter/mssql/select/select';
import mssql_truncate_truncate from '../interpreter/mssql/truncate/truncate';
import mssql_union_union from '../interpreter/mssql/union/union';
import mssql_update_update from '../interpreter/mssql/update/update';
import mssql_where_where from '../interpreter/mssql/where/where';
import mssql_where_where_group from '../interpreter/mssql/where/where_group';
import mssql_where_where_json from '../interpreter/mssql/where/where_json';
import mssql_where_where_subquery from '../interpreter/mssql/where/where_subquery';
import mssql_with_with from '../interpreter/mssql/with/with';
import mysql_alter_table_add_column from '../interpreter/mysql/alter_table/add_column';
import mysql_alter_table_add_constraint from '../interpreter/mysql/alter_table/add_constraint';
import mysql_alter_table_add_primary_key from '../interpreter/mysql/alter_table/add_primary_key';
import mysql_alter_table_alter_column_type from '../interpreter/mysql/alter_table/alter_column_type';
import mysql_alter_table_alter_table from '../interpreter/mysql/alter_table/alter_table';
import mysql_alter_table_drop_column from '../interpreter/mysql/alter_table/drop_column';
import mysql_alter_table_drop_constraint from '../interpreter/mysql/alter_table/drop_constraint';
import mysql_alter_table_drop_default from '../interpreter/mysql/alter_table/drop_default';
import mysql_alter_table_drop_not_null from '../interpreter/mysql/alter_table/drop_not_null';
import mysql_alter_table_drop_primary_key from '../interpreter/mysql/alter_table/drop_primary_key';
import mysql_alter_table_rename_column from '../interpreter/mysql/alter_table/rename_column';
import mysql_alter_table_rename_table from '../interpreter/mysql/alter_table/rename_table';
import mysql_alter_table_set_default from '../interpreter/mysql/alter_table/set_default';
import mysql_alter_table_set_not_null from '../interpreter/mysql/alter_table/set_not_null';
import mysql_column_column_type from '../interpreter/mysql/column/column_type';
import mysql_constraint_after from '../interpreter/mysql/constraint/after';
import mysql_constraint_constraint from '../interpreter/mysql/constraint/constraint';
import mysql_create_table_create_table from '../interpreter/mysql/create_table/create_table';
import mysql_delete_delete from '../interpreter/mysql/delete/delete';
import mysql_distinct_distinct from '../interpreter/mysql/distinct/distinct';
import mysql_distinct_distinct_on from '../interpreter/mysql/distinct/distinct_on';
import mysql_drop_table_drop_table from '../interpreter/mysql/drop_table/drop_table';
import mysql_from_from from '../interpreter/mysql/from/from';
import mysql_group_by_group_by from '../interpreter/mysql/group_by/group_by';
import mysql_having_having from '../interpreter/mysql/having/having';
import mysql_index_op_create_index from '../interpreter/mysql/index_op/create_index';
import mysql_index_op_drop_index from '../interpreter/mysql/index_op/drop_index';
import mysql_insert_insert from '../interpreter/mysql/insert/insert';
import mysql_join_join from '../interpreter/mysql/join/join';
import mysql_limit_limit from '../interpreter/mysql/limit/limit';
import mysql_lock_lock from '../interpreter/mysql/lock/lock';
import mysql_offset_offset from '../interpreter/mysql/offset/offset';
import mysql_on_duplicate_on_duplicate from '../interpreter/mysql/on_duplicate/on_duplicate';
import mysql_order_by_order_by from '../interpreter/mysql/order_by/order_by';
import mysql_raw_raw from '../interpreter/mysql/raw/raw';
import mysql_schema_foreign_key_info from '../interpreter/mysql/schema/foreign_key_info';
import mysql_schema_index_info from '../interpreter/mysql/schema/index_info';
import mysql_schema_primary_key_info from '../interpreter/mysql/schema/primary_key_info';
import mysql_schema_table_info from '../interpreter/mysql/schema/table_info';
import mysql_select_select from '../interpreter/mysql/select/select';
import mysql_truncate_truncate from '../interpreter/mysql/truncate/truncate';
import mysql_union_union from '../interpreter/mysql/union/union';
import mysql_update_update from '../interpreter/mysql/update/update';
import mysql_where_where from '../interpreter/mysql/where/where';
import mysql_where_where_group from '../interpreter/mysql/where/where_group';
import mysql_where_where_json from '../interpreter/mysql/where/where_json';
import mysql_where_where_subquery from '../interpreter/mysql/where/where_subquery';
import mysql_with_with from '../interpreter/mysql/with/with';
import oracledb_alter_table_add_column from '../interpreter/oracledb/alter_table/add_column';
import oracledb_alter_table_add_constraint from '../interpreter/oracledb/alter_table/add_constraint';
import oracledb_alter_table_add_primary_key from '../interpreter/oracledb/alter_table/add_primary_key';
import oracledb_alter_table_alter_column_type from '../interpreter/oracledb/alter_table/alter_column_type';
import oracledb_alter_table_alter_table from '../interpreter/oracledb/alter_table/alter_table';
import oracledb_alter_table_drop_column from '../interpreter/oracledb/alter_table/drop_column';
import oracledb_alter_table_drop_constraint from '../interpreter/oracledb/alter_table/drop_constraint';
import oracledb_alter_table_drop_default from '../interpreter/oracledb/alter_table/drop_default';
import oracledb_alter_table_drop_not_null from '../interpreter/oracledb/alter_table/drop_not_null';
import oracledb_alter_table_drop_primary_key from '../interpreter/oracledb/alter_table/drop_primary_key';
import oracledb_alter_table_rename_column from '../interpreter/oracledb/alter_table/rename_column';
import oracledb_alter_table_rename_table from '../interpreter/oracledb/alter_table/rename_table';
import oracledb_alter_table_set_default from '../interpreter/oracledb/alter_table/set_default';
import oracledb_alter_table_set_not_null from '../interpreter/oracledb/alter_table/set_not_null';
import oracledb_column_column_type from '../interpreter/oracledb/column/column_type';
import oracledb_constraint_after from '../interpreter/oracledb/constraint/after';
import oracledb_constraint_constraint from '../interpreter/oracledb/constraint/constraint';
import oracledb_create_table_create_table from '../interpreter/oracledb/create_table/create_table';
import oracledb_delete_delete from '../interpreter/oracledb/delete/delete';
import oracledb_distinct_distinct from '../interpreter/oracledb/distinct/distinct';
import oracledb_distinct_distinct_on from '../interpreter/oracledb/distinct/distinct_on';
import oracledb_drop_table_drop_table from '../interpreter/oracledb/drop_table/drop_table';
import oracledb_from_from from '../interpreter/oracledb/from/from';
import oracledb_group_by_group_by from '../interpreter/oracledb/group_by/group_by';
import oracledb_having_having from '../interpreter/oracledb/having/having';
import oracledb_index_op_create_index from '../interpreter/oracledb/index_op/create_index';
import oracledb_index_op_drop_index from '../interpreter/oracledb/index_op/drop_index';
import oracledb_insert_insert from '../interpreter/oracledb/insert/insert';
import oracledb_join_join from '../interpreter/oracledb/join/join';
import oracledb_limit_limit from '../interpreter/oracledb/limit/limit';
import oracledb_lock_lock from '../interpreter/oracledb/lock/lock';
import oracledb_offset_offset from '../interpreter/oracledb/offset/offset';
import oracledb_on_duplicate_on_duplicate from '../interpreter/oracledb/on_duplicate/on_duplicate';
import oracledb_order_by_order_by from '../interpreter/oracledb/order_by/order_by';
import oracledb_raw_raw from '../interpreter/oracledb/raw/raw';
import oracledb_schema_foreign_key_info from '../interpreter/oracledb/schema/foreign_key_info';
import oracledb_schema_index_info from '../interpreter/oracledb/schema/index_info';
import oracledb_schema_primary_key_info from '../interpreter/oracledb/schema/primary_key_info';
import oracledb_schema_table_info from '../interpreter/oracledb/schema/table_info';
import oracledb_select_select from '../interpreter/oracledb/select/select';
import oracledb_truncate_truncate from '../interpreter/oracledb/truncate/truncate';
import oracledb_union_union from '../interpreter/oracledb/union/union';
import oracledb_update_update from '../interpreter/oracledb/update/update';
import oracledb_where_where from '../interpreter/oracledb/where/where';
import oracledb_where_where_group from '../interpreter/oracledb/where/where_group';
import oracledb_where_where_json from '../interpreter/oracledb/where/where_json';
import oracledb_where_where_subquery from '../interpreter/oracledb/where/where_subquery';
import oracledb_with_with from '../interpreter/oracledb/with/with';
import postgres_alter_table_add_column from '../interpreter/postgres/alter_table/add_column';
import postgres_alter_table_add_constraint from '../interpreter/postgres/alter_table/add_constraint';
import postgres_alter_table_add_primary_key from '../interpreter/postgres/alter_table/add_primary_key';
import postgres_alter_table_alter_column_type from '../interpreter/postgres/alter_table/alter_column_type';
import postgres_alter_table_alter_table from '../interpreter/postgres/alter_table/alter_table';
import postgres_alter_table_drop_column from '../interpreter/postgres/alter_table/drop_column';
import postgres_alter_table_drop_constraint from '../interpreter/postgres/alter_table/drop_constraint';
import postgres_alter_table_drop_default from '../interpreter/postgres/alter_table/drop_default';
import postgres_alter_table_drop_not_null from '../interpreter/postgres/alter_table/drop_not_null';
import postgres_alter_table_drop_primary_key from '../interpreter/postgres/alter_table/drop_primary_key';
import postgres_alter_table_rename_column from '../interpreter/postgres/alter_table/rename_column';
import postgres_alter_table_rename_table from '../interpreter/postgres/alter_table/rename_table';
import postgres_alter_table_set_default from '../interpreter/postgres/alter_table/set_default';
import postgres_alter_table_set_not_null from '../interpreter/postgres/alter_table/set_not_null';
import postgres_column_column_type from '../interpreter/postgres/column/column_type';
import postgres_constraint_after from '../interpreter/postgres/constraint/after';
import postgres_constraint_constraint from '../interpreter/postgres/constraint/constraint';
import postgres_create_table_create_table from '../interpreter/postgres/create_table/create_table';
import postgres_delete_delete from '../interpreter/postgres/delete/delete';
import postgres_distinct_distinct from '../interpreter/postgres/distinct/distinct';
import postgres_distinct_distinct_on from '../interpreter/postgres/distinct/distinct_on';
import postgres_drop_table_drop_table from '../interpreter/postgres/drop_table/drop_table';
import postgres_from_from from '../interpreter/postgres/from/from';
import postgres_group_by_group_by from '../interpreter/postgres/group_by/group_by';
import postgres_having_having from '../interpreter/postgres/having/having';
import postgres_index_op_create_index from '../interpreter/postgres/index_op/create_index';
import postgres_index_op_drop_index from '../interpreter/postgres/index_op/drop_index';
import postgres_insert_insert from '../interpreter/postgres/insert/insert';
import postgres_join_join from '../interpreter/postgres/join/join';
import postgres_limit_limit from '../interpreter/postgres/limit/limit';
import postgres_lock_lock from '../interpreter/postgres/lock/lock';
import postgres_offset_offset from '../interpreter/postgres/offset/offset';
import postgres_on_duplicate_on_duplicate from '../interpreter/postgres/on_duplicate/on_duplicate';
import postgres_order_by_order_by from '../interpreter/postgres/order_by/order_by';
import postgres_raw_raw from '../interpreter/postgres/raw/raw';
import postgres_schema_foreign_key_info from '../interpreter/postgres/schema/foreign_key_info';
import postgres_schema_index_info from '../interpreter/postgres/schema/index_info';
import postgres_schema_primary_key_info from '../interpreter/postgres/schema/primary_key_info';
import postgres_schema_table_info from '../interpreter/postgres/schema/table_info';
import postgres_select_select from '../interpreter/postgres/select/select';
import postgres_truncate_truncate from '../interpreter/postgres/truncate/truncate';
import postgres_union_union from '../interpreter/postgres/union/union';
import postgres_update_update from '../interpreter/postgres/update/update';
import postgres_where_where from '../interpreter/postgres/where/where';
import postgres_where_where_group from '../interpreter/postgres/where/where_group';
import postgres_where_where_json from '../interpreter/postgres/where/where_json';
import postgres_where_where_subquery from '../interpreter/postgres/where/where_subquery';
import postgres_with_with from '../interpreter/postgres/with/with';
import sqlite_alter_table_add_column from '../interpreter/sqlite/alter_table/add_column';
import sqlite_alter_table_add_constraint from '../interpreter/sqlite/alter_table/add_constraint';
import sqlite_alter_table_alter_column_type from '../interpreter/sqlite/alter_table/alter_column_type';
import sqlite_alter_table_alter_table from '../interpreter/sqlite/alter_table/alter_table';
import sqlite_alter_table_drop_column from '../interpreter/sqlite/alter_table/drop_column';
import sqlite_alter_table_drop_constraint from '../interpreter/sqlite/alter_table/drop_constraint';
import sqlite_alter_table_drop_default from '../interpreter/sqlite/alter_table/drop_default';
import sqlite_alter_table_drop_not_null from '../interpreter/sqlite/alter_table/drop_not_null';
import sqlite_alter_table_drop_primary_key from '../interpreter/sqlite/alter_table/drop_primary_key';
import sqlite_alter_table_rename_column from '../interpreter/sqlite/alter_table/rename_column';
import sqlite_alter_table_rename_table from '../interpreter/sqlite/alter_table/rename_table';
import sqlite_alter_table_set_default from '../interpreter/sqlite/alter_table/set_default';
import sqlite_alter_table_set_not_null from '../interpreter/sqlite/alter_table/set_not_null';
import sqlite_column_column_type from '../interpreter/sqlite/column/column_type';
import sqlite_constraint_after from '../interpreter/sqlite/constraint/after';
import sqlite_constraint_constraint from '../interpreter/sqlite/constraint/constraint';
import sqlite_create_table_create_table from '../interpreter/sqlite/create_table/create_table';
import sqlite_delete_delete from '../interpreter/sqlite/delete/delete';
import sqlite_distinct_distinct from '../interpreter/sqlite/distinct/distinct';
import sqlite_distinct_distinct_on from '../interpreter/sqlite/distinct/distinct_on';
import sqlite_drop_table_drop_table from '../interpreter/sqlite/drop_table/drop_table';
import sqlite_from_from from '../interpreter/sqlite/from/from';
import sqlite_group_by_group_by from '../interpreter/sqlite/group_by/group_by';
import sqlite_having_having from '../interpreter/sqlite/having/having';
import sqlite_index_op_create_index from '../interpreter/sqlite/index_op/create_index';
import sqlite_index_op_drop_index from '../interpreter/sqlite/index_op/drop_index';
import sqlite_insert_insert from '../interpreter/sqlite/insert/insert';
import sqlite_join_join from '../interpreter/sqlite/join/join';
import sqlite_limit_limit from '../interpreter/sqlite/limit/limit';
import sqlite_lock_lock from '../interpreter/sqlite/lock/lock';
import sqlite_offset_offset from '../interpreter/sqlite/offset/offset';
import sqlite_on_duplicate_on_duplicate from '../interpreter/sqlite/on_duplicate/on_duplicate';
import sqlite_order_by_order_by from '../interpreter/sqlite/order_by/order_by';
import sqlite_raw_raw from '../interpreter/sqlite/raw/raw';
import sqlite_schema_foreign_key_info from '../interpreter/sqlite/schema/foreign_key_info';
import sqlite_schema_index_info from '../interpreter/sqlite/schema/index_info';
import sqlite_schema_primary_key_info from '../interpreter/sqlite/schema/primary_key_info';
import sqlite_schema_table_info from '../interpreter/sqlite/schema/table_info';
import sqlite_select_select from '../interpreter/sqlite/select/select';
import sqlite_truncate_truncate from '../interpreter/sqlite/truncate/truncate';
import sqlite_union_union from '../interpreter/sqlite/union/union';
import sqlite_update_update from '../interpreter/sqlite/update/update';
import sqlite_where_where from '../interpreter/sqlite/where/where';
import sqlite_where_where_group from '../interpreter/sqlite/where/where_group';
import sqlite_where_where_json from '../interpreter/sqlite/where/where_json';
import sqlite_where_where_subquery from '../interpreter/sqlite/where/where_subquery';
import sqlite_with_with from '../interpreter/sqlite/with/with';

export const interpreterMap = {
  mssql: {
    alter_table: {
      add_column: mssql_alter_table_add_column,
      add_constraint: mssql_alter_table_add_constraint,
      add_primary_key: mssql_alter_table_add_primary_key,
      alter_column_type: mssql_alter_table_alter_column_type,
      alter_table: mssql_alter_table_alter_table,
      drop_column: mssql_alter_table_drop_column,
      drop_constraint: mssql_alter_table_drop_constraint,
      drop_default: mssql_alter_table_drop_default,
      drop_not_null: mssql_alter_table_drop_not_null,
      drop_primary_key: mssql_alter_table_drop_primary_key,
      rename_column: mssql_alter_table_rename_column,
      rename_table: mssql_alter_table_rename_table,
      set_default: mssql_alter_table_set_default,
      set_not_null: mssql_alter_table_set_not_null,
    },
    column: {
      column_type: mssql_column_column_type,
    },
    constraint: {
      after: mssql_constraint_after,
      constraint: mssql_constraint_constraint,
    },
    create_table: {
      create_table: mssql_create_table_create_table,
    },
    delete: {
      delete: mssql_delete_delete,
    },
    distinct: {
      distinct: mssql_distinct_distinct,
      distinct_on: mssql_distinct_distinct_on,
    },
    drop_table: {
      drop_table: mssql_drop_table_drop_table,
    },
    from: {
      from: mssql_from_from,
    },
    group_by: {
      group_by: mssql_group_by_group_by,
    },
    having: {
      having: mssql_having_having,
    },
    index_op: {
      create_index: mssql_index_op_create_index,
      drop_index: mssql_index_op_drop_index,
    },
    insert: {
      insert: mssql_insert_insert,
    },
    join: {
      join: mssql_join_join,
    },
    limit: {
      limit: mssql_limit_limit,
    },
    lock: {
      lock: mssql_lock_lock,
    },
    offset: {
      offset: mssql_offset_offset,
    },
    on_duplicate: {
      on_duplicate: mssql_on_duplicate_on_duplicate,
    },
    order_by: {
      order_by: mssql_order_by_order_by,
    },
    raw: {
      raw: mssql_raw_raw,
    },
    schema: {
      foreign_key_info: mssql_schema_foreign_key_info,
      index_info: mssql_schema_index_info,
      primary_key_info: mssql_schema_primary_key_info,
      table_info: mssql_schema_table_info,
    },
    select: {
      select: mssql_select_select,
    },
    truncate: {
      truncate: mssql_truncate_truncate,
    },
    union: {
      union: mssql_union_union,
    },
    update: {
      update: mssql_update_update,
    },
    where: {
      where: mssql_where_where,
      where_group: mssql_where_where_group,
      where_json: mssql_where_where_json,
      where_subquery: mssql_where_where_subquery,
    },
    with: {
      with: mssql_with_with,
    },
  },
  mysql: {
    alter_table: {
      add_column: mysql_alter_table_add_column,
      add_constraint: mysql_alter_table_add_constraint,
      add_primary_key: mysql_alter_table_add_primary_key,
      alter_column_type: mysql_alter_table_alter_column_type,
      alter_table: mysql_alter_table_alter_table,
      drop_column: mysql_alter_table_drop_column,
      drop_constraint: mysql_alter_table_drop_constraint,
      drop_default: mysql_alter_table_drop_default,
      drop_not_null: mysql_alter_table_drop_not_null,
      drop_primary_key: mysql_alter_table_drop_primary_key,
      rename_column: mysql_alter_table_rename_column,
      rename_table: mysql_alter_table_rename_table,
      set_default: mysql_alter_table_set_default,
      set_not_null: mysql_alter_table_set_not_null,
    },
    column: {
      column_type: mysql_column_column_type,
    },
    constraint: {
      after: mysql_constraint_after,
      constraint: mysql_constraint_constraint,
    },
    create_table: {
      create_table: mysql_create_table_create_table,
    },
    delete: {
      delete: mysql_delete_delete,
    },
    distinct: {
      distinct: mysql_distinct_distinct,
      distinct_on: mysql_distinct_distinct_on,
    },
    drop_table: {
      drop_table: mysql_drop_table_drop_table,
    },
    from: {
      from: mysql_from_from,
    },
    group_by: {
      group_by: mysql_group_by_group_by,
    },
    having: {
      having: mysql_having_having,
    },
    index_op: {
      create_index: mysql_index_op_create_index,
      drop_index: mysql_index_op_drop_index,
    },
    insert: {
      insert: mysql_insert_insert,
    },
    join: {
      join: mysql_join_join,
    },
    limit: {
      limit: mysql_limit_limit,
    },
    lock: {
      lock: mysql_lock_lock,
    },
    offset: {
      offset: mysql_offset_offset,
    },
    on_duplicate: {
      on_duplicate: mysql_on_duplicate_on_duplicate,
    },
    order_by: {
      order_by: mysql_order_by_order_by,
    },
    raw: {
      raw: mysql_raw_raw,
    },
    schema: {
      foreign_key_info: mysql_schema_foreign_key_info,
      index_info: mysql_schema_index_info,
      primary_key_info: mysql_schema_primary_key_info,
      table_info: mysql_schema_table_info,
    },
    select: {
      select: mysql_select_select,
    },
    truncate: {
      truncate: mysql_truncate_truncate,
    },
    union: {
      union: mysql_union_union,
    },
    update: {
      update: mysql_update_update,
    },
    where: {
      where: mysql_where_where,
      where_group: mysql_where_where_group,
      where_json: mysql_where_where_json,
      where_subquery: mysql_where_where_subquery,
    },
    with: {
      with: mysql_with_with,
    },
  },
  oracledb: {
    alter_table: {
      add_column: oracledb_alter_table_add_column,
      add_constraint: oracledb_alter_table_add_constraint,
      add_primary_key: oracledb_alter_table_add_primary_key,
      alter_column_type: oracledb_alter_table_alter_column_type,
      alter_table: oracledb_alter_table_alter_table,
      drop_column: oracledb_alter_table_drop_column,
      drop_constraint: oracledb_alter_table_drop_constraint,
      drop_default: oracledb_alter_table_drop_default,
      drop_not_null: oracledb_alter_table_drop_not_null,
      drop_primary_key: oracledb_alter_table_drop_primary_key,
      rename_column: oracledb_alter_table_rename_column,
      rename_table: oracledb_alter_table_rename_table,
      set_default: oracledb_alter_table_set_default,
      set_not_null: oracledb_alter_table_set_not_null,
    },
    column: {
      column_type: oracledb_column_column_type,
    },
    constraint: {
      after: oracledb_constraint_after,
      constraint: oracledb_constraint_constraint,
    },
    create_table: {
      create_table: oracledb_create_table_create_table,
    },
    delete: {
      delete: oracledb_delete_delete,
    },
    distinct: {
      distinct: oracledb_distinct_distinct,
      distinct_on: oracledb_distinct_distinct_on,
    },
    drop_table: {
      drop_table: oracledb_drop_table_drop_table,
    },
    from: {
      from: oracledb_from_from,
    },
    group_by: {
      group_by: oracledb_group_by_group_by,
    },
    having: {
      having: oracledb_having_having,
    },
    index_op: {
      create_index: oracledb_index_op_create_index,
      drop_index: oracledb_index_op_drop_index,
    },
    insert: {
      insert: oracledb_insert_insert,
    },
    join: {
      join: oracledb_join_join,
    },
    limit: {
      limit: oracledb_limit_limit,
    },
    lock: {
      lock: oracledb_lock_lock,
    },
    offset: {
      offset: oracledb_offset_offset,
    },
    on_duplicate: {
      on_duplicate: oracledb_on_duplicate_on_duplicate,
    },
    order_by: {
      order_by: oracledb_order_by_order_by,
    },
    raw: {
      raw: oracledb_raw_raw,
    },
    schema: {
      foreign_key_info: oracledb_schema_foreign_key_info,
      index_info: oracledb_schema_index_info,
      primary_key_info: oracledb_schema_primary_key_info,
      table_info: oracledb_schema_table_info,
    },
    select: {
      select: oracledb_select_select,
    },
    truncate: {
      truncate: oracledb_truncate_truncate,
    },
    union: {
      union: oracledb_union_union,
    },
    update: {
      update: oracledb_update_update,
    },
    where: {
      where: oracledb_where_where,
      where_group: oracledb_where_where_group,
      where_json: oracledb_where_where_json,
      where_subquery: oracledb_where_where_subquery,
    },
    with: {
      with: oracledb_with_with,
    },
  },
  postgres: {
    alter_table: {
      add_column: postgres_alter_table_add_column,
      add_constraint: postgres_alter_table_add_constraint,
      add_primary_key: postgres_alter_table_add_primary_key,
      alter_column_type: postgres_alter_table_alter_column_type,
      alter_table: postgres_alter_table_alter_table,
      drop_column: postgres_alter_table_drop_column,
      drop_constraint: postgres_alter_table_drop_constraint,
      drop_default: postgres_alter_table_drop_default,
      drop_not_null: postgres_alter_table_drop_not_null,
      drop_primary_key: postgres_alter_table_drop_primary_key,
      rename_column: postgres_alter_table_rename_column,
      rename_table: postgres_alter_table_rename_table,
      set_default: postgres_alter_table_set_default,
      set_not_null: postgres_alter_table_set_not_null,
    },
    column: {
      column_type: postgres_column_column_type,
    },
    constraint: {
      after: postgres_constraint_after,
      constraint: postgres_constraint_constraint,
    },
    create_table: {
      create_table: postgres_create_table_create_table,
    },
    delete: {
      delete: postgres_delete_delete,
    },
    distinct: {
      distinct: postgres_distinct_distinct,
      distinct_on: postgres_distinct_distinct_on,
    },
    drop_table: {
      drop_table: postgres_drop_table_drop_table,
    },
    from: {
      from: postgres_from_from,
    },
    group_by: {
      group_by: postgres_group_by_group_by,
    },
    having: {
      having: postgres_having_having,
    },
    index_op: {
      create_index: postgres_index_op_create_index,
      drop_index: postgres_index_op_drop_index,
    },
    insert: {
      insert: postgres_insert_insert,
    },
    join: {
      join: postgres_join_join,
    },
    limit: {
      limit: postgres_limit_limit,
    },
    lock: {
      lock: postgres_lock_lock,
    },
    offset: {
      offset: postgres_offset_offset,
    },
    on_duplicate: {
      on_duplicate: postgres_on_duplicate_on_duplicate,
    },
    order_by: {
      order_by: postgres_order_by_order_by,
    },
    raw: {
      raw: postgres_raw_raw,
    },
    schema: {
      foreign_key_info: postgres_schema_foreign_key_info,
      index_info: postgres_schema_index_info,
      primary_key_info: postgres_schema_primary_key_info,
      table_info: postgres_schema_table_info,
    },
    select: {
      select: postgres_select_select,
    },
    truncate: {
      truncate: postgres_truncate_truncate,
    },
    union: {
      union: postgres_union_union,
    },
    update: {
      update: postgres_update_update,
    },
    where: {
      where: postgres_where_where,
      where_group: postgres_where_where_group,
      where_json: postgres_where_where_json,
      where_subquery: postgres_where_where_subquery,
    },
    with: {
      with: postgres_with_with,
    },
  },
  sqlite: {
    alter_table: {
      add_column: sqlite_alter_table_add_column,
      add_constraint: sqlite_alter_table_add_constraint,
      alter_column_type: sqlite_alter_table_alter_column_type,
      alter_table: sqlite_alter_table_alter_table,
      drop_column: sqlite_alter_table_drop_column,
      drop_constraint: sqlite_alter_table_drop_constraint,
      drop_default: sqlite_alter_table_drop_default,
      drop_not_null: sqlite_alter_table_drop_not_null,
      drop_primary_key: sqlite_alter_table_drop_primary_key,
      rename_column: sqlite_alter_table_rename_column,
      rename_table: sqlite_alter_table_rename_table,
      set_default: sqlite_alter_table_set_default,
      set_not_null: sqlite_alter_table_set_not_null,
    },
    column: {
      column_type: sqlite_column_column_type,
    },
    constraint: {
      after: sqlite_constraint_after,
      constraint: sqlite_constraint_constraint,
    },
    create_table: {
      create_table: sqlite_create_table_create_table,
    },
    delete: {
      delete: sqlite_delete_delete,
    },
    distinct: {
      distinct: sqlite_distinct_distinct,
      distinct_on: sqlite_distinct_distinct_on,
    },
    drop_table: {
      drop_table: sqlite_drop_table_drop_table,
    },
    from: {
      from: sqlite_from_from,
    },
    group_by: {
      group_by: sqlite_group_by_group_by,
    },
    having: {
      having: sqlite_having_having,
    },
    index_op: {
      create_index: sqlite_index_op_create_index,
      drop_index: sqlite_index_op_drop_index,
    },
    insert: {
      insert: sqlite_insert_insert,
    },
    join: {
      join: sqlite_join_join,
    },
    limit: {
      limit: sqlite_limit_limit,
    },
    lock: {
      lock: sqlite_lock_lock,
    },
    offset: {
      offset: sqlite_offset_offset,
    },
    on_duplicate: {
      on_duplicate: sqlite_on_duplicate_on_duplicate,
    },
    order_by: {
      order_by: sqlite_order_by_order_by,
    },
    raw: {
      raw: sqlite_raw_raw,
    },
    schema: {
      foreign_key_info: sqlite_schema_foreign_key_info,
      index_info: sqlite_schema_index_info,
      primary_key_info: sqlite_schema_primary_key_info,
      table_info: sqlite_schema_table_info,
    },
    select: {
      select: sqlite_select_select,
    },
    truncate: {
      truncate: sqlite_truncate_truncate,
    },
    union: {
      union: sqlite_union_union,
    },
    update: {
      update: sqlite_update_update,
    },
    where: {
      where: sqlite_where_where,
      where_group: sqlite_where_where_group,
      where_json: sqlite_where_where_json,
      where_subquery: sqlite_where_where_subquery,
    },
    with: {
      with: sqlite_with_with,
    },
  },
} as any;
