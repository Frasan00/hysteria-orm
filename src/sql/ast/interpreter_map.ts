import mysql_alter_table_add_column from '../interpreter/mysql/alter_table/add_column';
import mysql_alter_table_add_constraint from '../interpreter/mysql/alter_table/add_constraint';
import mysql_alter_table_add_primary_key from '../interpreter/mysql/alter_table/add_primary_key';
import mysql_alter_table_alter_column_type from '../interpreter/mysql/alter_table/alter_column_type';
import mysql_alter_table_alter_table from '../interpreter/mysql/alter_table/alter_table';
import mysql_alter_table_drop_column from '../interpreter/mysql/alter_table/drop_column';
import mysql_alter_table_drop_constraint from '../interpreter/mysql/alter_table/drop_constraint';
import mysql_alter_table_drop_primary_key from '../interpreter/mysql/alter_table/drop_primary_key';
import mysql_alter_table_rename_column from '../interpreter/mysql/alter_table/rename_column';
import mysql_alter_table_rename_table from '../interpreter/mysql/alter_table/rename_table';
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
import mysql_select_select from '../interpreter/mysql/select/select';
import mysql_truncate_truncate from '../interpreter/mysql/truncate/truncate';
import mysql_union_union from '../interpreter/mysql/union/union';
import mysql_update_update from '../interpreter/mysql/update/update';
import mysql_where_where from '../interpreter/mysql/where/where';
import mysql_where_where_group from '../interpreter/mysql/where/where_group';
import mysql_where_where_json from '../interpreter/mysql/where/where_json';
import mysql_where_where_subquery from '../interpreter/mysql/where/where_subquery';
import mysql_with_with from '../interpreter/mysql/with/with';
import postgres_alter_table_add_column from '../interpreter/postgres/alter_table/add_column';
import postgres_alter_table_add_constraint from '../interpreter/postgres/alter_table/add_constraint';
import postgres_alter_table_add_primary_key from '../interpreter/postgres/alter_table/add_primary_key';
import postgres_alter_table_alter_column_type from '../interpreter/postgres/alter_table/alter_column_type';
import postgres_alter_table_alter_table from '../interpreter/postgres/alter_table/alter_table';
import postgres_alter_table_drop_column from '../interpreter/postgres/alter_table/drop_column';
import postgres_alter_table_drop_constraint from '../interpreter/postgres/alter_table/drop_constraint';
import postgres_alter_table_drop_primary_key from '../interpreter/postgres/alter_table/drop_primary_key';
import postgres_alter_table_rename_column from '../interpreter/postgres/alter_table/rename_column';
import postgres_alter_table_rename_table from '../interpreter/postgres/alter_table/rename_table';
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
import sqlite_alter_table_rename_column from '../interpreter/sqlite/alter_table/rename_column';
import sqlite_alter_table_rename_table from '../interpreter/sqlite/alter_table/rename_table';
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
  mysql: {
    alter_table: {
      add_column: mysql_alter_table_add_column,
      add_constraint: mysql_alter_table_add_constraint,
      add_primary_key: mysql_alter_table_add_primary_key,
      alter_column_type: mysql_alter_table_alter_column_type,
      alter_table: mysql_alter_table_alter_table,
      drop_column: mysql_alter_table_drop_column,
      drop_constraint: mysql_alter_table_drop_constraint,
      drop_primary_key: mysql_alter_table_drop_primary_key,
      rename_column: mysql_alter_table_rename_column,
      rename_table: mysql_alter_table_rename_table,
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
  postgres: {
    alter_table: {
      add_column: postgres_alter_table_add_column,
      add_constraint: postgres_alter_table_add_constraint,
      add_primary_key: postgres_alter_table_add_primary_key,
      alter_column_type: postgres_alter_table_alter_column_type,
      alter_table: postgres_alter_table_alter_table,
      drop_column: postgres_alter_table_drop_column,
      drop_constraint: postgres_alter_table_drop_constraint,
      drop_primary_key: postgres_alter_table_drop_primary_key,
      rename_column: postgres_alter_table_rename_column,
      rename_table: postgres_alter_table_rename_table,
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
      rename_column: sqlite_alter_table_rename_column,
      rename_table: sqlite_alter_table_rename_table,
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
