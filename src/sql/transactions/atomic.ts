import { HysteriaError } from "../../errors/hysteria_error";
import { SqlDataSource } from "../sql_data_source";
import type { TransactionIsolationLevel } from "./transaction_types";

/**
 * Async method type constraint for atomic decorator.
 */
type AsyncMethod = (...args: any[]) => Promise<any>;

/**
 * @description Options for the atomic decorator.
 */
export type AtomicOptions = {
  /**
   * @description Property name on the class instance that holds the SqlDataSource,
   * a SqlDataSource instance, or a function receiving the instance and returning the SqlDataSource.
   * @default "sql"
   */
  dataSource?: string | SqlDataSource | ((instance: any) => SqlDataSource);
  /**
   * @description Transaction isolation level.
   */
  isolationLevel?: TransactionIsolationLevel;
};

/**
 * @description Resolves the SqlDataSource from the class instance using the provided option.
 */
function resolveSqlDataSource(
  instance: any,
  dataSource: string | SqlDataSource | ((instance: any) => SqlDataSource),
): SqlDataSource {
  if (dataSource instanceof SqlDataSource) {
    return dataSource;
  }

  const ds =
    typeof dataSource === "function"
      ? dataSource(instance)
      : instance[dataSource];

  if (!ds || !(ds instanceof SqlDataSource)) {
    throw new HysteriaError(
      "atomic::resolveSqlDataSource",
      "ATOMIC_DATASOURCE_RESOLUTION_FAILED",
    );
  }

  return ds;
}

/**
 * @description Wraps an async method in a callback-style transaction with
 * AsyncLocalStorage (CLS) auto-propagation.
 *
 * The decorated method must be async and return a Promise.
 * The transaction is committed if the method succeeds, rolled back if it throws.
 *
 * @throws {Error} if the resolved SqlDataSource has `clsEnabled: false`.
 *
 * @example
 * ```ts
 * class UserService {
 *   sql = new SqlDataSource();
 *
 *   @atomic()
 *   async createUser(data: UserData): Promise<User> {
 *     const user = await this.sql.from(User).insert(data);
 *     await this.sql.from(Profile).insert({ userId: user.id });
 *     return user;
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * class UserService {
 *   db = new SqlDataSource();
 *
 *   @atomic({ dataSource: "db", isolationLevel: "SERIALIZABLE" })
 *   async createUser(data: UserData): Promise<User> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * atomic.sqlDataSource = new SqlDataSource();
 *
 * class UserService {
 *   @atomic()
 *   async createUser(data: UserData): Promise<User> {
 *     // Uses atomic.sqlDataSource automatically
 *   }
 * }
 * ```
 */
export function atomic(
  options?: AtomicOptions,
): <T extends AsyncMethod>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T>;

/**
 * @description Legacy overload accepting a property name string directly.
 */
export function atomic(
  dataSourceProperty: string,
  isolationLevel?: TransactionIsolationLevel,
): <T extends AsyncMethod>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T>;

export function atomic(
  arg?: string | AtomicOptions,
  maybeIsolationLevel?: TransactionIsolationLevel,
): <T extends AsyncMethod>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> {
  const options: AtomicOptions =
    typeof arg === "string"
      ? { dataSource: arg, isolationLevel: maybeIsolationLevel }
      : (arg ?? {});

  return <T extends AsyncMethod>(
    _target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> => {
    const originalMethod = descriptor.value;
    if (!originalMethod || typeof originalMethod !== "function") {
      throw new HysteriaError("atomic::descriptor", "ATOMIC_INVALID_METHOD");
    }

    descriptor.value = async function (
      this: any,
      ...args: Parameters<T>
    ): Promise<ReturnType<T>> {
      let sql: SqlDataSource;

      if (options.dataSource) {
        sql = resolveSqlDataSource(this, options.dataSource);
      } else if (atomic.sqlDataSource) {
        sql = atomic.sqlDataSource;
      } else {
        sql = resolveSqlDataSource(this, "sql");
      }

      if (!sql.isClsEnabled) {
        throw new HysteriaError("atomic::descriptor", "ATOMIC_CLS_DISABLED");
      }

      const result = await sql.transaction(
        async () => {
          return await originalMethod.apply(this, args);
        },
        { isolationLevel: options.isolationLevel },
      );

      return result as ReturnType<T>;
    } as unknown as T;

    return descriptor;
  };
}

export namespace atomic {
  /**
   * @description Global default SqlDataSource used by all @atomic decorators
   * when no per-decorator dataSource option is provided and the host class
   * does not expose a "sql" property.
   *
   * @default undefined
   */
  export let sqlDataSource: SqlDataSource | undefined;
}
