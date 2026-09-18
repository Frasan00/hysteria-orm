import type { DriverAdapter } from "../drivers/driver_adapter";
import { resolveDriverAdapter } from "../drivers/driver_adapter_registry";
import "../drivers/adapters/node";
import {
  resolveJsEnvironment,
  type ResolvedJsEnvironment,
} from "../platform/js_environment";
import {
  AnySqlDataSourceInput,
  SqlDataSourceType,
  SqlPoolType,
} from "./sql_data_source_types";

/**
 * Registers the platform-specific drivers once, for the resolved environment.
 * Guarded dynamic imports are the point: a node bundle never loads the wasm or
 * react-native engine modules.
 */
const ensureDriversForEnvironment = async (
  env: ResolvedJsEnvironment,
): Promise<void> => {
  if (env === "bun") {
    await (await import("../drivers/adapters/bun")).registerBunDrivers();
    return;
  }
  if (env === "web") {
    (await import("../drivers/adapters/web")).registerWebDrivers();
    return;
  }
  if (env === "react-native") {
    await (
      await import("../drivers/adapters/web")
    ).registerReactNativeDrivers();
    return;
  }
  // node adapters register by side effect on import
};

/**
 * @description Resolves the driver adapter for (type, environment, driver
 * override) and creates its pool. This is the single seam where execution
 * drivers are selected; future drivers (mysql, web-sqlite, …) plug in here.
 */
export const createSqlDriver = async <T extends SqlDataSourceType>(
  type: T,
  input?: AnySqlDataSourceInput<T>,
): Promise<DriverAdapter<T>> => {
  const jsEnvironment = resolveJsEnvironment(input?.jsEnvironment);
  await ensureDriversForEnvironment(jsEnvironment);
  const adapter = await resolveDriverAdapter(
    type,
    jsEnvironment,
    input?.driver,
    input,
  );
  await adapter.createPool();
  return adapter;
};

export const createSqlPool = async <T extends SqlDataSourceType>(
  type: T,
  input?: AnySqlDataSourceInput<T>,
): Promise<SqlPoolType> => {
  const adapter = await createSqlDriver(type, input);
  return adapter.pool;
};
