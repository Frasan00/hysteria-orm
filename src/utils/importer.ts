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
  const { createJiti } = await import("jiti").catch(() => {
    throw new Error(
      "`jiti` npm package is required to import TypeScript files when running migrations locally. Install it with: npm install --save-dev jiti",
    );
  });

  const jiti = createJiti(import.meta.url, {
    moduleCache: false,
    fsCache: false,
  });

  const mod = await jiti.import(filepath);
  return mod as T;
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
