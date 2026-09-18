import {
  PlatformUnsupportedError,
  bytesToHex,
  type PlatformAdapter,
  type PlatformFs,
  type PlatformPath,
} from "./platform_adapter";
import type { ResolvedJsEnvironment } from "./js_environment";

/** RFC 4122 v4 from raw entropy, for hosts whose crypto lacks randomUUID. */
const uuidV4FromBytes = (bytes: Uint8Array): string => {
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
};

/**
 * Throws at call time rather than construction: the platform is built at
 * module-eval (env.ts), and ids must fail loudly instead of falling back to
 * weak randomness.
 * The buffer is pinned to `ArrayBuffer` because the DOM lib's `getRandomValues`
 * takes `ArrayBufferView<ArrayBuffer>`, which the bare `Uint8Array` default
 * (`ArrayBufferLike`) does not satisfy.
 */
const randomValues = (
  bytes: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> => {
  const webCrypto = globalThis.crypto as Crypto | undefined;
  if (!webCrypto || typeof webCrypto.getRandomValues !== "function") {
    throw new PlatformUnsupportedError(
      "crypto.getRandomValues — browsers require a secure context (HTTPS); " +
        "React Native requires react-native-get-random-values or expo-crypto",
    );
  }
  return webCrypto.getRandomValues(bytes);
};

class WebPlatformFs implements PlatformFs {
  private unsupported(method: string): never {
    throw new PlatformUnsupportedError(`fs.${method}`);
  }

  exists(): boolean {
    return this.unsupported("exists");
  }

  readFileSync(): Uint8Array | null {
    return this.unsupported("readFileSync");
  }

  readFile(): Promise<string | Uint8Array> {
    return this.unsupported("readFile");
  }

  readdir(): Promise<string[]> {
    return this.unsupported("readdir");
  }

  mkdir(): Promise<void> {
    return this.unsupported("mkdir");
  }

  writeFile(): Promise<void> {
    return this.unsupported("writeFile");
  }

  rm(): Promise<void> {
    return this.unsupported("rm");
  }
}

/** Minimal POSIX-string path implementation for runtimes without node:path. */
class WebPlatformPath implements PlatformPath {
  join(...parts: string[]): string {
    return parts.filter(Boolean).join("/").replace(/\/+/g, "/");
  }

  dirname(path: string): string {
    const index = path.lastIndexOf("/");
    return index <= 0 ? "." : path.slice(0, index);
  }

  basename(path: string, ext?: string): string {
    const base = path.slice(path.lastIndexOf("/") + 1);
    return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
  }

  resolve(...parts: string[]): string {
    const joined = parts.filter(Boolean).join("/").replace(/\/+/g, "/");
    return joined.startsWith("/") ? joined : `/${joined}`;
  }
}

/**
 * Web-first base: uses only web-standard globals (globalThis.crypto and
 * globalThis.performance) so it runs anywhere node ≥ 22 or bun runs.
 * fs throws; node and bun subclasses provide filesystem access.
 */
export class WebPlatformAdapter implements PlatformAdapter {
  readonly name: ResolvedJsEnvironment = "web";

  readEnv(_key: string): string | undefined {
    return undefined;
  }

  crypto = {
    // react-native-get-random-values only polyfills getRandomValues.
    randomUUID: (): string => {
      const webCrypto = globalThis.crypto as Crypto | undefined;
      return typeof webCrypto?.randomUUID === "function"
        ? webCrypto.randomUUID()
        : uuidV4FromBytes(randomValues(new Uint8Array(16)));
    },
    randomBytes: (size: number): Uint8Array => randomValues(new Uint8Array(size)),
  };

  timing = {
    now: (): number => globalThis.performance.now(),
  };

  fs: PlatformFs = new WebPlatformFs();

  path: PlatformPath = new WebPlatformPath();
}
