import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function importJs<T>(filepath: string): Promise<T> {
  try {
    const fileUrl = pathToFileURL(filepath).href;
    return import(fileUrl) as Promise<T>;
  } catch {
    const require = createRequire(import.meta.url);
    const module = require(filepath);
    return {
      default: module.default || module,
      ...module,
    } as T;
  }
}

async function importTs<T>(filepath: string): Promise<T> {
  const { build } = await import("esbuild").catch(() => {
    throw new Error(
      "esbuild is required to import TypeScript files. Install it with: npm install esbuild -D",
    );
  });

  const randId = Math.random().toString(36).slice(2, 8);
  const outfile = filepath.replace(/\.ts$/, `.bundled_${randId}.mjs`);

  try {
    await build({
      entryPoints: [filepath],
      bundle: true,
      platform: "node",
      format: "esm",
      sourcemap: "inline",
      outfile,
      packages: "external",
      logLevel: "silent",
    });

    const fileUrl = pathToFileURL(outfile).href;
    return (await import(fileUrl)) as T;
  } finally {
    await fs.promises.unlink(outfile).catch(() => {});
  }
}

export async function importTsUniversal<T = any>(
  entry: string,
  _tsconfigPath?: string,
): Promise<T> {
  const filepath = path.isAbsolute(entry)
    ? entry
    : path.resolve(process.cwd(), entry);

  if (filepath.endsWith(".ts")) {
    return importTs<T>(filepath);
  }

  return importJs<T>(filepath);
}
