import {
  PlatformUnsupportedError,
  type PlatformAdapter,
  type PlatformFs,
  type PlatformPath,
} from "./platform_adapter";
import type { ResolvedJsEnvironment } from "./js_environment";

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
    randomUUID: (): string => globalThis.crypto.randomUUID(),
    randomBytes: (size: number): Uint8Array => {
      const bytes = new Uint8Array(size);
      globalThis.crypto.getRandomValues(bytes);
      return bytes;
    },
  };

  timing = {
    now: (): number => globalThis.performance.now(),
  };

  fs: PlatformFs = new WebPlatformFs();

  path: PlatformPath = new WebPlatformPath();
}
