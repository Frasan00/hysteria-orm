import type { DriverAdapterFactory } from "../../driver_adapter_registry";
import { registerDriverAdapter } from "../../driver_adapter_registry";
import {
  SqliteRnDriverAdapter,
  type SqliteRnEngine,
} from "./sqlite_rn.adapter";
import {
  SqliteWasmDriverAdapter,
  type SqliteWasmInitConfig,
} from "./sqlite_wasm.adapter";

// Idempotent: the datasource ensure-path calls these, and a test that registers
// first with a wasmBinary must not be overwritten by that later call.
let webRegistered = false;
let webInitConfig: SqliteWasmInitConfig | undefined;

/**
 * Registers the browser sqlite driver. The engine is imported lazily inside the
 * adapter, so nothing here runs under node/bun.
 */
export const registerWebDrivers = (initConfig?: SqliteWasmInitConfig): void => {
  if (webRegistered) {
    return;
  }
  webRegistered = true;
  webInitConfig = initConfig;

  registerDriverAdapter({
    name: "sqlite-wasm",
    dialects: ["sqlite"],
    environments: ["web"] as const,
    create: ({ dialect, input }) =>
      new SqliteWasmDriverAdapter(
        dialect as "sqlite",
        input as never,
        undefined,
        webInitConfig,
      ),
  } satisfies DriverAdapterFactory);
};

let reactNativeRegistered = false;

/**
 * Registers the React Native sqlite driver. The guarded import is the only place
 * the native module is loaded, so it never reaches a non-RN bundle.
 */
export const registerReactNativeDrivers = async (): Promise<void> => {
  if (reactNativeRegistered) {
    return;
  }
  reactNativeRegistered = true;

  const engine = (await import("@op-engineering/op-sqlite" as string)) as {
    open: SqliteRnEngine["open"];
  };

  registerDriverAdapter({
    name: "sqlite-rn",
    dialects: ["sqlite"],
    environments: ["react-native"] as const,
    create: ({ dialect, input }) =>
      new SqliteRnDriverAdapter(dialect as "sqlite", input as never, engine),
  } satisfies DriverAdapterFactory);
};
