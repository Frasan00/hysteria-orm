import mysql_delete_delete from '../interpreter/mysql/delete/delete';
import mysql_distinct_distinct from '../interpreter/mysql/distinct/distinct';
import mysql_distinct_distinct_on from '../interpreter/mysql/distinct/distinct_on';
import mysql_from_from from '../interpreter/mysql/from/from';
import mysql_group_by_group_by from '../interpreter/mysql/group_by/group_by';
import mysql_having_having from '../interpreter/mysql/having/having';
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
import postgres_delete_delete from '../interpreter/postgres/delete/delete';
import postgres_distinct_distinct from '../interpreter/postgres/distinct/distinct';
import postgres_distinct_distinct_on from '../interpreter/postgres/distinct/distinct_on';
import postgres_from_from from '../interpreter/postgres/from/from';
import postgres_group_by_group_by from '../interpreter/postgres/group_by/group_by';
import postgres_having_having from '../interpreter/postgres/having/having';
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
import sqlite_delete_delete from '../interpreter/sqlite/delete/delete';
import sqlite_distinct_distinct from '../interpreter/sqlite/distinct/distinct';
import sqlite_distinct_distinct_on from '../interpreter/sqlite/distinct/distinct_on';
import sqlite_from_from from '../interpreter/sqlite/from/from';
import sqlite_group_by_group_by from '../interpreter/sqlite/group_by/group_by';
import sqlite_having_having from '../interpreter/sqlite/having/having';
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
    delete: {
      delete: mysql_delete_delete,
    },
    distinct: {
      distinct: mysql_distinct_distinct,
      distinct_on: mysql_distinct_distinct_on,
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
    delete: {
      delete: postgres_delete_delete,
    },
    distinct: {
      distinct: postgres_distinct_distinct,
      distinct_on: postgres_distinct_distinct_on,
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
    delete: {
      delete: sqlite_delete_delete,
    },
    distinct: {
      distinct: sqlite_distinct_distinct,
      distinct_on: sqlite_distinct_distinct_on,
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
