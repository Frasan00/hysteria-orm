import type { DriverAdapter } from "../drivers/driver_adapter";
import { resolveDriverAdapter } from "../drivers/driver_adapter_registry";
import "../drivers/adapters/node";
import { resolveJsEnvironment } from "../platform/js_environment";
import {
  SqlDataSourceInput,
  SqlDataSourceType,
  SqlPoolType,
} from "./sql_data_source_types";

/**
 * Registers the bun-native drivers once, when the resolved environment is bun.
 * Safe to request from node (the guarded imports never run there).
 */
const ensureBunDrivers = async (): Promise<void> => {
  if (
    (await import("../platform/js_environment")).resolveJsEnvironment() !==
    "bun"
  ) {
    return;
  }
  const mod = await import("../drivers/adapters/bun");
  await mod.registerBunDrivers();
};

/**
 * @description Resolves the driver adapter for (type, environment, driver
 * override) and creates its pool. This is the single seam where execution
 * drivers are selected; future drivers (mysql, web-sqlite, …) plug in here.
 */
export const createSqlDriver = async <T extends SqlDataSourceType>(
  type: T,
  input?: SqlDataSourceInput<T>,
): Promise<DriverAdapter<T>> => {
  const jsEnvironment = resolveJsEnvironment(input?.jsEnvironment);
  if (jsEnvironment === "bun") {
    await ensureBunDrivers();
  }
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
  input?: SqlDataSourceInput<T>,
): Promise<SqlPoolType> => {
  const adapter = await createSqlDriver(type, input);
  return adapter.pool;
};
