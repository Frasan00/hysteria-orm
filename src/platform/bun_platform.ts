import { NodePlatformAdapter } from "./node_platform";

interface BunFile {
  text(): Promise<string>;
}

interface BunFsModule {
  file(path: string): BunFile;
  write(path: string, data: string | Uint8Array): Promise<number>;
  Glob: new (pattern: string) => {
    scan(options?: { cwd?: string }): AsyncIterable<string>;
  };
}

const loadBun = (): Promise<BunFsModule> =>
  import("bun" as string) as Promise<BunFsModule>;

/**
 * Bun implementation: Bun-native async file methods where Bun provides them,
 * inheriting node:fs only for what Bun lacks (sync reads, recursive mkdir/rm).
 */
export class BunPlatformAdapter extends NodePlatformAdapter {
  readonly name = "bun" as const;

  constructor() {
    super();
    const superFs = this.fs;
    this.fs = {
      ...superFs,
      readFile: async (path: string): Promise<string | Uint8Array> => {
        const bun = await loadBun();
        return bun.file(path).text();
      },
      readdir: async (path: string): Promise<string[]> => {
        const bun = await loadBun();
        const entries: string[] = [];
        for await (const entry of new bun.Glob("*").scan({ cwd: path })) {
          entries.push(entry);
        }
        return entries;
      },
      writeFile: async (
        path: string,
        data: string | Uint8Array,
      ): Promise<void> => {
        const bun = await loadBun();
        await bun.write(path, data);
      },
    };
  }
}
