import {
  type JsEnvironmentValue,
  type ResolvedJsEnvironment,
  resolveJsEnvironment,
} from "./js_environment";
import { BunPlatformAdapter } from "./bun_platform";
import { NodePlatformAdapter } from "./node_platform";
import { WebPlatformAdapter } from "./web_platform";

/**
 * Thrown by web platform implementations for capabilities that inherently need
 * a host filesystem (or an environment) that browsers do not provide.
 */
export class PlatformUnsupportedError extends Error {
  constructor(feature: string) {
    super(`Platform does not support: ${feature}`);
    this.name = "PlatformUnsupportedError";
  }
}

export interface PlatformFs {
  exists(path: string): boolean;
  readFileSync(path: string): Uint8Array | null;
  readFile(path: string): Promise<string | Uint8Array>;
  readdir(path: string): Promise<string[]>;
  mkdir(path: string, opts?: { recursive?: boolean }): Promise<void>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  rm(
    path: string,
    opts?: { recursive?: boolean; force?: boolean },
  ): Promise<void>;
}

export interface PlatformPath {
  join(...parts: string[]): string;
  dirname(path: string): string;
  basename(path: string, ext?: string): string;
  resolve(...parts: string[]): string;
}

export interface PlatformAdapter {
  readonly name: ResolvedJsEnvironment;
  readEnv(key: string): string | undefined;
  crypto: {
    randomUUID(): string;
    randomBytes(size: number): Uint8Array;
  };
  timing: {
    now(): number;
  };
  fs: PlatformFs;
  path: PlatformPath;
}

/** Hex-encodes raw bytes without depending on Buffer (node/bun/web safe). */
export const bytesToHex = (bytes: Uint8Array): string => {
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
};

const platforms = new Map<ResolvedJsEnvironment, PlatformAdapter>();

const createPlatform = (env: ResolvedJsEnvironment): PlatformAdapter => {
  switch (env) {
    case "bun":
      return new BunPlatformAdapter();
    case "node":
      return new NodePlatformAdapter();
    default:
      return new WebPlatformAdapter();
  }
};

/**
 * Returns the platform adapter for the given (or auto-resolved) environment,
 * cached per resolved environment.
 */
export function loadPlatform(
  jsEnvironment?: JsEnvironmentValue,
): PlatformAdapter {
  const resolved = resolveJsEnvironment(jsEnvironment);
  let platform = platforms.get(resolved);
  if (!platform) {
    platform = createPlatform(resolved);
    platforms.set(resolved, platform);
  }
  return platform;
}
