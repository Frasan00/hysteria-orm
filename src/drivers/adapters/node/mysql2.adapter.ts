import { PassThrough } from "node:stream";
import type { Mysql2Import } from "../../driver_types";
import type { Model } from "../../../sql/models/model";
import type { StreamOptions } from "../../../sql/query_builder/query_builder_types";
import type {
  GetConnectionReturnType,
  getPoolReturnType,
  SqlDataSourceInput,
} from "../../../sql/sql_data_source_types";
import type {
  RawQueryResponseType,
  Returning,
  SqlRunnerReturnType,
} from "../../../sql/sql_runner/sql_runner_types";
import type {
  BeginTransactionOptions,
  DriverAdapter,
  EndTransactionOptions,
  ExecuteOptions,
  StreamEvents,
} from "../../driver_adapter";

type MysqlDialect = "mysql" | "mariadb";

/**
 * @description node mysql2 driver adapter (mysql | mariadb)
 * @description mysql2's native transaction methods plus the `SET TRANSACTION ISOLATION LEVEL` statement stay here
 */
export class Mysql2DriverAdapter implements DriverAdapter<MysqlDialect> {
  readonly dialect: MysqlDialect;
  readonly jsEnvironment = "node" as const;
  pool: getPoolReturnType<MysqlDialect>;

  private client: Mysql2Import;
  private input: SqlDataSourceInput<MysqlDialect>;

  constructor(
    dialect: MysqlDialect,
    input: SqlDataSourceInput<MysqlDialect>,
    client: Mysql2Import,
  ) {
    this.dialect = dialect;
    this.client = client;
    this.input = input;
    this.pool = client.createPool({
      host: input.host,
      port: input.port,
      user: input.username,
      password: input.password,
      database: input.database,
      ...input.driverOptions,
    });
  }

  createPool(): void {}

  async closePool(): Promise<void> {
    await this.pool.end();
  }

  async reserveConnection(): Promise<GetConnectionReturnType<MysqlDialect>> {
    return this.pool.getConnection();
  }

  releaseConnection(connection?: GetConnectionReturnType<MysqlDialect>): void {
    connection?.release();
  }

  async beginTransaction(
    connection: GetConnectionReturnType<MysqlDialect>,
    options: BeginTransactionOptions<MysqlDialect>,
  ): Promise<void> {
    if (options.isolationLevel) {
      await options.rawQuery(
        `SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`,
      );
    }
    await connection.beginTransaction();
  }

  async commitTransaction(
    connection: GetConnectionReturnType<MysqlDialect>,
    _options: EndTransactionOptions<MysqlDialect>,
  ): Promise<void> {
    await connection.commit();
  }

  async rollbackTransaction(
    connection: GetConnectionReturnType<MysqlDialect>,
    _options: EndTransactionOptions<MysqlDialect>,
  ): Promise<void> {
    await connection.rollback();
  }

  async execute(
    query: string,
    params: unknown[],
    options: ExecuteOptions<MysqlDialect, Model>,
  ): Promise<RawQueryResponseType<MysqlDialect>> {
    const driver =
      (options.connection as GetConnectionReturnType<MysqlDialect>) ??
      this.pool;
    return driver.query(query, params) as Promise<
      RawQueryResponseType<MysqlDialect>
    >;
  }

  extract<T extends Returning>(
    raw: RawQueryResponseType<MysqlDialect>,
    returning: T,
  ): SqlRunnerReturnType<T, MysqlDialect> {
    const tuple = raw as unknown as [unknown, unknown] & {
      0?: { affectedRows?: number };
    };
    if (returning === "affectedRows") {
      return (tuple[0]?.affectedRows ?? 0) as SqlRunnerReturnType<
        T,
        MysqlDialect
      >;
    }
    if (returning === "raw") {
      return raw as SqlRunnerReturnType<T, MysqlDialect>;
    }
    return tuple[0] as SqlRunnerReturnType<T, MysqlDialect>;
  }

  async stream(
    query: string,
    params: unknown[],
    options: StreamOptions & {
      connection?: GetConnectionReturnType<MysqlDialect>;
    },
    events: StreamEvents,
  ): Promise<PassThrough & AsyncGenerator<Record<string, unknown>>> {
    const pool = this.pool;
    const conn =
      (options.connection as GetConnectionReturnType<MysqlDialect>) ??
      (await pool.getConnection());
    const passThrough = new PassThrough({
      objectMode: options.objectMode ?? true,
      highWaterMark: options.highWaterMark,
    }) as PassThrough & AsyncGenerator<Record<string, unknown>>;

    const rawConn = (conn as unknown as { connection: MysqlConnectionLike })
      .connection as unknown;
    const mysqlStream = (rawConn as MysqlConnectionLike)
      .query(query, params)
      .stream({
        highWaterMark: options.highWaterMark,
        objectMode: options.objectMode ?? true,
      });

    let pending = 0;
    let ended = false;
    let hasError = false;

    const tryRelease = () => {
      try {
        conn.release();
      } catch {
        // already released
      }
    };

    mysqlStream.on("data", (row: unknown) => {
      if (events.onData) {
        pending++;
        Promise.resolve(
          (events.onData as (...args: any[]) => any)(passThrough, row),
        )
          .then(() => {
            pending--;
            if (ended && pending === 0 && !hasError) {
              tryRelease();
              passThrough.end();
            }
          })
          .catch((err: unknown) => {
            hasError = true;
            tryRelease();
            passThrough.destroy(err as Error);
          });
        return;
      }

      passThrough.write(row);
    });

    mysqlStream.on("end", () => {
      ended = true;
      if (pending === 0 && !hasError) {
        tryRelease();
        passThrough.end();
      }
    });

    mysqlStream.on("error", (err: Error) => {
      hasError = true;
      tryRelease();
      passThrough.destroy(err);
    });

    passThrough.on("close", () => {
      tryRelease();
    });

    return passThrough;
  }
}

interface MysqlConnectionLike {
  connection?: unknown;
  query(query: string, params?: unknown[]): { stream(options?: object): any };
}
