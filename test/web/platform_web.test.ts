/**
 * Runs under jsdom: the point is that a browser host resolves to "web" and the
 * platform layer never reaches for node builtins.
 */
import {
  loadPlatform,
  PlatformUnsupportedError,
} from "../../src/platform/platform_adapter";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const withCrypto = <T>(value: unknown, fn: () => T): T => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", {
    value,
    configurable: true,
    writable: true,
  });
  try {
    return fn();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "crypto", descriptor);
    }
  }
};

describe("web platform", () => {
  it("resolves to web under a browser host", () => {
    expect(loadPlatform().name).toBe("web");
  });

  it("exposes no environment variables", () => {
    expect(loadPlatform().readEnv("DATABASE_URL")).toBeUndefined();
  });

  it("throws on every filesystem method", () => {
    const { fs } = loadPlatform();

    expect(() => fs.exists("/tmp")).toThrow(PlatformUnsupportedError);
    expect(() => fs.readFileSync("/tmp")).toThrow(PlatformUnsupportedError);
    expect(() => fs.readFile("/tmp")).toThrow(PlatformUnsupportedError);
    expect(() => fs.readdir("/tmp")).toThrow(PlatformUnsupportedError);
    expect(() => fs.mkdir("/tmp")).toThrow(PlatformUnsupportedError);
    expect(() => fs.writeFile("/tmp", "x")).toThrow(PlatformUnsupportedError);
    expect(() => fs.rm("/tmp")).toThrow(PlatformUnsupportedError);
  });

  it("implements the path helpers browsers need", () => {
    const { path } = loadPlatform();
    expect(path.join("a", "b", "c")).toBe("a/b/c");
    expect(path.dirname("a/b/c.txt")).toBe("a/b");
    expect(path.basename("a/b/c.txt", ".txt")).toBe("c");
    expect(path.resolve("a", "b")).toBe("/a/b");
  });

  it("generates a v4 uuid from the host crypto", () => {
    expect(loadPlatform().crypto.randomUUID()).toMatch(UUID_V4);
  });

  it("builds a v4 uuid when the host only polyfills getRandomValues", () => {
    // react-native-get-random-values provides getRandomValues but not randomUUID.
    const filled = { value: false };
    const fallback = {
      getRandomValues(bytes: Uint8Array): Uint8Array {
        filled.value = true;
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = i;
        }
        return bytes;
      },
    };

    withCrypto(fallback, () => {
      expect(loadPlatform().crypto.randomUUID()).toMatch(UUID_V4);
      expect(filled.value).toBe(true);
    });
  });

  it("fails loudly with an actionable message when crypto is missing", () => {
    withCrypto(undefined, () => {
      expect(() => loadPlatform().crypto.randomUUID()).toThrow(
        /react-native-get-random-values/,
      );
      expect(() => loadPlatform().crypto.randomBytes(8)).toThrow(
        PlatformUnsupportedError,
      );
    });
  });
});
