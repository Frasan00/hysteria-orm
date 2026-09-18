/**
 * @jest-environment node
 *
 * Detection must run in a host with no window/document, so jsdom is excluded —
 * otherwise every case would trivially resolve to "web".
 */
import { PlatformUnsupportedError } from "../../src/platform/platform_adapter";

const withGlobal = <T>(key: string, value: unknown, fn: () => T): T => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
  try {
    return fn();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
    } else {
      delete (globalThis as Record<string, unknown>)[key];
    }
  }
};

const load = async () =>
  (await import("../../src/platform/js_environment")).resolveJsEnvironment;

describe("resolveJsEnvironment", () => {
  it("short-circuits every explicit value, whatever the host looks like", async () => {
    const resolve = await load();

    expect(resolve("web")).toBe("web");
    expect(resolve("bun")).toBe("bun");
    expect(resolve("react-native")).toBe("react-native");
    expect(resolve("node")).toBe("node");

    withGlobal("navigator", { product: "ReactNative" }, () => {
      expect(resolve("node")).toBe("node");
      expect(resolve("auto")).toBe("react-native");
    });
  });

  it("defaults to node with no distinguishing global", async () => {
    const resolve = await load();
    expect(resolve()).toBe("node");
    expect(resolve("auto")).toBe("node");
  });

  it("detects react-native from navigator.product", async () => {
    const resolve = await load();
    withGlobal("navigator", { product: "ReactNative" }, () => {
      expect(resolve()).toBe("react-native");
    });
  });

  it("detects react-native from HermesInternal", async () => {
    const resolve = await load();
    withGlobal("HermesInternal", {}, () => {
      expect(resolve()).toBe("react-native");
    });
  });

  it("detects a worker from self alone", async () => {
    const resolve = await load();
    // Workers have no window, no document and no process — without this they
    // resolved to "node" and then dereferenced process.env at import time.
    withGlobal("self", {}, () => {
      expect(resolve()).toBe("web");
    });
  });

  it("prefers bun over every other signal", async () => {
    const resolve = await load();
    const versions = process.versions as Record<string, string | undefined>;
    withGlobal("navigator", { product: "ReactNative" }, () =>
      withGlobal("self", {}, () => {
        versions.bun = "1.4.0";
        try {
          expect(resolve()).toBe("bun");
        } finally {
          delete versions.bun;
        }
      }),
    );
  });

  it("picks a platform adapter per environment", async () => {
    const { loadPlatform } = await import("../../src/platform/platform_adapter");

    expect(loadPlatform("node").name).toBe("node");
    expect(loadPlatform("web").name).toBe("web");

    // React Native inherits the web platform: no filesystem, no process.env.
    const rn = loadPlatform("react-native");
    expect(rn.name).toBe("react-native");
    expect(rn.readEnv("PATH")).toBeUndefined();
    expect(() => rn.fs.exists("/tmp")).toThrow(PlatformUnsupportedError);
  });
});
