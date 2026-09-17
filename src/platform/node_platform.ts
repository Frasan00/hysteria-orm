import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import type { PlatformFs, PlatformPath } from "./platform_adapter";
import type { ResolvedJsEnvironment } from "./js_environment";
import { WebPlatformAdapter } from "./web_platform";

/**
 * Node/bun implementation. The only layer of the runtime that touches
 * node builtins (fs, path, process.env); crypto and timing inherit the
 * web-standard globals from WebPlatformAdapter.
 */
export class NodePlatformAdapter extends WebPlatformAdapter {
  readonly name: ResolvedJsEnvironment = "node";

  readEnv(key: string): string | undefined {
    return process.env[key];
  }

  fs: PlatformFs = {
    exists: (p: string): boolean => fs.existsSync(p),
    readFileSync: (p: string): Uint8Array | null => {
      if (!fs.existsSync(p)) {
        return null;
      }
      return new Uint8Array(fs.readFileSync(p));
    },
    readFile: async (p: string): Promise<string | Uint8Array> =>
      fsp.readFile(p, "utf8"),
    readdir: (p: string): Promise<string[]> => fsp.readdir(p),
    mkdir: async (p: string, opts?: { recursive?: boolean }): Promise<void> => {
      await fsp.mkdir(p, { recursive: opts?.recursive });
    },
    writeFile: async (p: string, data: string | Uint8Array): Promise<void> => {
      await fsp.writeFile(p, data);
    },
    rm: async (
      p: string,
      opts?: { recursive?: boolean; force?: boolean },
    ): Promise<void> => {
      await fsp.rm(p, { recursive: opts?.recursive, force: opts?.force });
    },
  };

  path: PlatformPath = path;
}
