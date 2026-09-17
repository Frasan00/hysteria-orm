import type { ResolvedJsEnvironment } from "../platform/js_environment";
import type {
  SqlDataSourceInput,
  SqlDataSourceType,
} from "../sql/sql_data_source_types";
import { DriverNotFoundError } from "./driver_constants";
import type { DriverAdapter } from "./driver_adapter";

export interface DriverAdapterFactoryContext<D extends SqlDataSourceType> {
  readonly dialect: D;
  readonly jsEnvironment: ResolvedJsEnvironment;
  readonly input?: SqlDataSourceInput<D>;
}

export interface DriverAdapterFactory<
  D extends SqlDataSourceType = SqlDataSourceType,
> {
  readonly name: string;
  readonly dialects: readonly D[];
  /** JS runtimes this driver supports, defaults to ["node"] */
  readonly environments?: readonly ResolvedJsEnvironment[];
  create(
    context: DriverAdapterFactoryContext<D>,
  ): Promise<DriverAdapter<D>> | DriverAdapter<D>;
}

const factories: DriverAdapterFactory[] = [];

/**
 * @description Public plugin hook: future drivers (e.g. "mysql" replacing
 * "mysql2", a web/WASM sqlite) register here without touching the runtime.
 */
export const registerDriverAdapter = (factory: DriverAdapterFactory): void => {
  factories.push(factory);
};

/**
 * @description Resolves a driver adapter for (dialect, environment). An
 * explicit driver name wins; otherwise the most specific (dialect, environment)
 * match, falling back to the node environment (e.g. bun + mssql → npm mssql).
 */
export const resolveDriverAdapter = async <D extends SqlDataSourceType>(
  dialect: D,
  jsEnvironment: ResolvedJsEnvironment,
  driver?: string,
  input?: SqlDataSourceInput<D>,
): Promise<DriverAdapter<D>> => {
  const candidates = factories.filter((f) =>
    (f.dialects as readonly string[]).includes(dialect),
  );

  const supportsEnv = (f: DriverAdapterFactory, env: ResolvedJsEnvironment) =>
    (f.environments ?? (["node"] as const)).includes(env);

  // An explicit driver name must also support the resolved environment, so a
  // node runtime can't silently pick a bun-only driver (which would fail at
  // import). Otherwise the most specific (dialect, env) match wins, with a
  // node fallback (e.g. bun + mssql → npm mssql).
  const exact =
    candidates.find(
      (f) =>
        (driver ? f.name === driver : true) && supportsEnv(f, jsEnvironment),
    ) ?? candidates.find((f) => supportsEnv(f, "node"));

  if (!exact) {
    throw new DriverNotFoundError(driver ?? dialect);
  }

  return exact.create({
    dialect,
    jsEnvironment,
    input,
  }) as DriverAdapter<D>;
};
