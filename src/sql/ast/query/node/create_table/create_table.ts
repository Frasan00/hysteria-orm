import { QueryNode } from "../../query";
import { ConstraintNode } from "../constraint";
import type { DatabaseTableOptions } from "../../../../migrations/schema/schema_types";

export class CreateTableNode extends QueryNode {
  table: string;
  children: QueryNode[];
  namedConstraints: ConstraintNode[];
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "create_table";
  file = "create_table";
  ifNotExists: boolean;

  // MySQL options
  engine?: string;
  charset?: string;
  collate?: string;
  rowFormat?: string;
  autoIncrement?: number;
  dataDirectory?: string;
  indexDirectory?: string;
  maxRows?: number;
  minRows?: number;
  checksum?: boolean;
  encrypted?: boolean;
  comment?: string;

  // PostgreSQL options
  tablespace?: string;
  unlogged?: boolean;
  temporary?: boolean;
  postgresWith?: Record<string, string | number | boolean>;

  // SQLite options
  strict?: boolean;
  withoutRowId?: boolean;
  sqliteTemporary?: boolean;

  // MSSQL options
  onFilegroup?: string;
  textImageOn?: string;
  dataCompression?: string;

  // OracleDB options
  oracleTablespace?: string;
  oracleCompress?: boolean;
  oracleStorage?: Record<string, any>;
  oracleLogging?: boolean;
  oracleCache?: boolean;
  oracleInMemory?: boolean;
  oracleCompressFor?: string;

  constructor(
    table: string,
    children: QueryNode[] = [],
    namedConstraints: ConstraintNode[] = [],
    ifNotExists: boolean = false,
    options?: DatabaseTableOptions,
  ) {
    super("create table");
    this.table = table;
    this.children = children;
    this.namedConstraints = namedConstraints;
    this.ifNotExists = ifNotExists;

    if (options) {
      Object.assign(this, options);
    }
  }
}
