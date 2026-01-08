import type { IResult } from "mssql";
import type { QueryResult as MysqlResult } from "mysql2/promise";
import { Readable } from "node:stream";
import type { Result as OracleDBResult } from "oracledb";
import type { QueryResult as PgResult } from "pg";
import type { RunResult as SqliteResult } from "sqlite3";
import { Model } from "../models/model";
import {
  GetConnectionReturnType,
  SqlDataSourceType,
} from "../sql_data_source_types";

export type Returning = "rows" | "affectedRows" | "raw";

/**
 * @description Maps a SqlDataSourceType to the raw driver response type
 */
export type RawQueryResponseType<D extends SqlDataSourceType> = D extends
  | "mysql"
  | "mariadb"
  ? MysqlResult
  : D extends "postgres" | "cockroachdb"
    ? PgResult
    : D extends "sqlite"
      ? SqliteResult
      : D extends "mssql"
        ? IResult<any>
        : D extends "oracledb"
          ? OracleDBResult<any>
          : any;

export type SqlRunnerReturnType<
  T extends Returning,
  D extends SqlDataSourceType,
> = T extends "rows"
  ? any
  : T extends "affectedRows"
    ? number
    : RawQueryResponseType<D>;

export type SqlLiteOptions<T extends Model> = {
  typeofModel?: typeof Model;
  mode?: "insertMany" | "insertOne" | "affectedRows" | "fetch" | "raw";
  models?: T | T[];
  customConnection?: GetConnectionReturnType<"sqlite">;
};

export type SqlStreamingReturnType<
  T extends "generator" | "stream",
  S extends Record<string, any>,
  R extends Record<string, any>,
> = T extends "generator" ? AsyncGenerator<Model & S & R> : Readable;
