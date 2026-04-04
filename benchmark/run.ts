#!/usr/bin/env tsx
/**
 * Benchmark runner
 *
 * Usage:
 *   tsx benchmark/run.ts [--dialect pg|mysql] [--suite model|raw|all]
 *                        [--warmup N] [--iterations N]
 *                        [--adapters hysteria,sequelize,typeorm,drizzle,prisma,pg,mysql2]
 *
 * Environment overrides:
 *   BENCH_DIALECT  BENCH_WARMUP  BENCH_ITERS  BENCH_ADAPTERS
 *   BENCH_PG_HOST  BENCH_PG_PORT  BENCH_PG_USER  BENCH_PG_PASSWORD  BENCH_PG_DATABASE
 *   BENCH_MYSQL_HOST  BENCH_MYSQL_PORT  BENCH_MYSQL_USER  BENCH_MYSQL_PASSWORD  BENCH_MYSQL_DATABASE
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { ResultSetHeader } from "mysql2";

import { getConfig, WARMUP_ITERS, BENCH_ITERS } from "./config.ts";
import { measure } from "./measure.ts";
import { printResults, saveResults } from "./reporter.ts";
import type {
  ModelAdapter,
  RawQueryAdapter,
  BenchmarkResult,
  DbConfig,
  SeedData,
} from "./adapters/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── CLI arg parsing ───────────────────────────────────────────────────────────
function getArg(name: string, envKey: string, defaultVal: string): string {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf(`--${name}`);
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return process.env[envKey] ?? defaultVal;
}

const dialect = getArg("dialect", "BENCH_DIALECT", "pg") as "mysql" | "pg";
const suite = getArg("suite", "BENCH_SUITE", "all") as "model" | "raw" | "all";
const warmup = parseInt(getArg("warmup", "BENCH_WARMUP", String(WARMUP_ITERS)));
const iterations = parseInt(
  getArg("iterations", "BENCH_ITERS", String(BENCH_ITERS)),
);
const selectedAdapters = getArg("adapters", "BENCH_ADAPTERS", "all").split(",");

// ─── Schema setup via raw drivers ─────────────────────────────────────────────
async function setupSchema(config: DbConfig): Promise<void> {
  const sqlPath = join(__dirname, "schemas", `${config.dialect}.sql`);
  const sqlContent = readFileSync(sqlPath, "utf8");

  if (config.dialect === "pg") {
    const { Pool } = await import("pg");
    const pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    try {
      await pool.query(sqlContent);
    } finally {
      await pool.end();
    }
  } else {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.default.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      multipleStatements: true,
    });
    try {
      await conn.query(sqlContent);
    } finally {
      await conn.end();
    }
  }
  console.log(`  ✓ Schema (re)created for ${config.dialect.toUpperCase()}`);
}

// ─── Seeding ──────────────────────────────────────────────────────────────────
async function seedData(config: DbConfig): Promise<SeedData> {
  if (config.dialect === "pg") {
    const { Pool } = await import("pg");
    const pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    try {
      const userRes = await pool.query<{ id: number }>(
        "INSERT INTO bench_users (name, email) VALUES ($1, $2) RETURNING id",
        ["Seed User", "seed@bench.test"],
      );
      const userId = userRes.rows[0].id;

      const post1 = await pool.query<{ id: number }>(
        "INSERT INTO bench_posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING id",
        [userId, "Seed Post 1", "Content 1"],
      );
      const postId = post1.rows[0].id;

      await pool.query(
        "INSERT INTO bench_posts (user_id, title, content) VALUES ($1, $2, $3)",
        [userId, "Seed Post 2", "Content 2"],
      );

      const addrRes = await pool.query<{ id: number }>(
        "INSERT INTO bench_addresses (street, city) VALUES ($1, $2) RETURNING id",
        ["123 Main St", "Testville"],
      );
      const addressId = addrRes.rows[0].id;

      await pool.query(
        "INSERT INTO bench_user_addresses (user_id, address_id) VALUES ($1, $2)",
        [userId, addressId],
      );

      return { userId, postId, addressId };
    } finally {
      await pool.end();
    }
  } else {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.default.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    try {
      const [userRes] = await conn.query<ResultSetHeader>(
        "INSERT INTO bench_users (name, email) VALUES (?, ?)",
        ["Seed User", "seed@bench.test"],
      );
      const userId = userRes.insertId;

      const [post1] = await conn.query<ResultSetHeader>(
        "INSERT INTO bench_posts (user_id, title, content) VALUES (?, ?, ?)",
        [userId, "Seed Post 1", "Content 1"],
      );
      const postId = post1.insertId;

      await conn.query(
        "INSERT INTO bench_posts (user_id, title, content) VALUES (?, ?, ?)",
        [userId, "Seed Post 2", "Content 2"],
      );

      const [addrRes] = await conn.query<ResultSetHeader>(
        "INSERT INTO bench_addresses (street, city) VALUES (?, ?)",
        ["123 Main St", "Testville"],
      );
      const addressId = addrRes.insertId;

      await conn.query(
        "INSERT INTO bench_user_addresses (user_id, address_id) VALUES (?, ?)",
        [userId, addressId],
      );

      return { userId, postId, addressId };
    } finally {
      await conn.end();
    }
  }
}

// ─── Benchmark suites ─────────────────────────────────────────────────────────
async function runModelSuite(
  adapter: ModelAdapter,
  seed: SeedData,
  w: number,
  iters: number,
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  let ephemeralId = 0;

  const ops: Array<{
    name: string;
    setup?: () => Promise<void>;
    fn: () => Promise<unknown>;
  }> = [
    {
      name: "create",
      fn: () => adapter.create({ name: "Bench User", email: "bench@test.com" }),
    },
    {
      name: "findAll",
      fn: () => adapter.findAll(),
    },
    {
      name: "findById",
      fn: () => adapter.findById(seed.userId),
    },
    {
      name: "update",
      fn: () => adapter.update(seed.userId, { name: "Updated Name" }),
    },
    {
      name: "delete",
      setup: async () => {
        const u = await adapter.create({
          name: "Del",
          email: "del@bench.test",
        });
        ephemeralId = u.id;
      },
      fn: () => adapter.delete(ephemeralId),
    },
    {
      name: "relation:1:1",
      fn: () => adapter.findUserWithPost(seed.userId),
    },
    {
      name: "relation:1:N",
      fn: () => adapter.findUserWithPosts(seed.userId),
    },
    {
      name: "relation:N:1",
      fn: () => adapter.findPostWithUser(seed.postId),
    },
    {
      name: "relation:N:N",
      fn: () => adapter.findUserWithAddresses(seed.userId),
    },
  ];

  for (const op of ops) {
    const stats = await measure(op.fn, w, iters, op.setup);
    results.push({
      adapter: adapter.name,
      suite: "model",
      operation: op.name,
      dialect,
      stats,
    });
  }

  return results;
}

async function runRawSuite(
  adapter: RawQueryAdapter,
  seed: SeedData,
  w: number,
  iters: number,
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  let ephemeralId: unknown = 0;

  const ops: Array<{
    name: string;
    setup?: () => Promise<void>;
    fn: () => Promise<unknown>;
  }> = [
    {
      name: "rawCreate",
      fn: () =>
        adapter.rawCreate({ name: "Bench User", email: "bench@test.com" }),
    },
    {
      name: "rawFindAll",
      fn: () => adapter.rawFindAll(),
    },
    {
      name: "rawFindById",
      fn: () => adapter.rawFindById(seed.userId),
    },
    {
      name: "rawUpdate",
      fn: () => adapter.rawUpdate(seed.userId, { name: "Updated Name" }),
    },
    {
      name: "rawDelete",
      setup: async () => {
        const row = await adapter.rawCreate({
          name: "Del",
          email: "del@bench.test",
        });
        ephemeralId = row.id;
      },
      fn: () => adapter.rawDelete(ephemeralId as number),
    },
  ];

  for (const op of ops) {
    const stats = await measure(op.fn, w, iters, op.setup);
    results.push({
      adapter: adapter.name,
      suite: "raw",
      operation: op.name,
      dialect,
      stats,
    });
  }

  return results;
}

// ─── Adapter registry ─────────────────────────────────────────────────────────
type AdapterEntry =
  | { type: "model"; adapter: ModelAdapter }
  | { type: "raw"; adapter: RawQueryAdapter };

function isSelected(name: string): boolean {
  return selectedAdapters.includes("all") || selectedAdapters.includes(name);
}

async function loadAdapters(config: DbConfig): Promise<AdapterEntry[]> {
  const entries: AdapterEntry[] = [];

  const loaders: Array<() => Promise<void>> = [];

  if (isSelected("hysteria") && (suite === "model" || suite === "all")) {
    loaders.push(async () => {
      const { HysteriaModelAdapter } =
        await import("./adapters/hysteria/model-adapter.ts");
      const a = new HysteriaModelAdapter();
      await a.connect(config);
      entries.push({ type: "model", adapter: a });
    });
  }

  if (isSelected("hysteria") && (suite === "raw" || suite === "all")) {
    loaders.push(async () => {
      const { HysteriaRawAdapter } =
        await import("./adapters/hysteria/raw-adapter.ts");
      const a = new HysteriaRawAdapter();
      await a.connect(config);
      entries.push({ type: "raw", adapter: a });
    });
  }

  if (isSelected("sequelize") && (suite === "model" || suite === "all")) {
    loaders.push(async () => {
      const { SequelizeModelAdapter } =
        await import("./adapters/sequelize/model-adapter.ts");
      const a = new SequelizeModelAdapter();
      await a.connect(config);
      entries.push({ type: "model", adapter: a });
    });
  }

  if (isSelected("sequelize") && (suite === "raw" || suite === "all")) {
    loaders.push(async () => {
      const { SequelizeRawAdapter } =
        await import("./adapters/sequelize/raw-adapter.ts");
      const a = new SequelizeRawAdapter();
      await a.connect(config);
      entries.push({ type: "raw", adapter: a });
    });
  }

  if (isSelected("typeorm") && (suite === "model" || suite === "all")) {
    loaders.push(async () => {
      const { TypeOrmModelAdapter } =
        await import("./adapters/typeorm/model-adapter.ts");
      const a = new TypeOrmModelAdapter();
      await a.connect(config);
      entries.push({ type: "model", adapter: a });
    });
  }

  if (isSelected("typeorm") && (suite === "raw" || suite === "all")) {
    loaders.push(async () => {
      const { TypeOrmRawAdapter } =
        await import("./adapters/typeorm/raw-adapter.ts");
      const a = new TypeOrmRawAdapter();
      await a.connect(config);
      entries.push({ type: "raw", adapter: a });
    });
  }

  if (isSelected("drizzle") && (suite === "model" || suite === "all")) {
    loaders.push(async () => {
      const { DrizzleModelAdapter } =
        await import("./adapters/drizzle/model-adapter.ts");
      const a = new DrizzleModelAdapter();
      await a.connect(config);
      entries.push({ type: "model", adapter: a });
    });
  }

  if (isSelected("drizzle") && (suite === "raw" || suite === "all")) {
    loaders.push(async () => {
      const { DrizzleRawAdapter } =
        await import("./adapters/drizzle/raw-adapter.ts");
      const a = new DrizzleRawAdapter();
      await a.connect(config);
      entries.push({ type: "raw", adapter: a });
    });
  }

  if (isSelected("prisma") && (suite === "model" || suite === "all")) {
    loaders.push(async () => {
      try {
        const { PrismaModelAdapter } =
          await import("./adapters/prisma/model-adapter.ts");
        const a = new PrismaModelAdapter();
        await a.connect(config);
        entries.push({ type: "model", adapter: a });
      } catch (e) {
        console.warn(
          `  ⚠ Prisma model adapter skipped: ${(e as Error).message.split("\n")[0]}`,
        );
        console.warn(`    Run: yarn benchmark:setup:${config.dialect}`);
      }
    });
  }

  if (isSelected("prisma") && (suite === "raw" || suite === "all")) {
    loaders.push(async () => {
      try {
        const { PrismaRawAdapter } =
          await import("./adapters/prisma/raw-adapter.ts");
        const a = new PrismaRawAdapter();
        await a.connect(config);
        entries.push({ type: "raw", adapter: a });
      } catch (e) {
        console.warn(
          `  ⚠ Prisma raw adapter skipped: ${(e as Error).message.split("\n")[0]}`,
        );
      }
    });
  }

  if (
    isSelected("pg") &&
    config.dialect === "pg" &&
    (suite === "raw" || suite === "all")
  ) {
    loaders.push(async () => {
      const { PgRawAdapter } = await import("./adapters/pg/raw-adapter.ts");
      const a = new PgRawAdapter();
      await a.connect(config);
      entries.push({ type: "raw", adapter: a });
    });
  }

  if (
    isSelected("mysql2") &&
    config.dialect === "mysql" &&
    (suite === "raw" || suite === "all")
  ) {
    loaders.push(async () => {
      const { Mysql2RawAdapter } =
        await import("./adapters/mysql2/raw-adapter.ts");
      const a = new Mysql2RawAdapter();
      await a.connect(config);
      entries.push({ type: "raw", adapter: a });
    });
  }

  // Connect adapters sequentially to avoid pool contention at startup
  for (const load of loaders) {
    try {
      await load();
    } catch (e) {
      console.error(`  ✗ Adapter failed to connect: ${(e as Error).message}`);
    }
  }

  return entries;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log(`  Hysteria ORM Benchmark`);
  console.log(
    `  Dialect: ${dialect.toUpperCase()} | Suite: ${suite} | Warmup: ${warmup} | Iterations: ${iterations}`,
  );
  console.log("=".repeat(80) + "\n");

  const config = getConfig(dialect);
  const allResults: BenchmarkResult[] = [];

  // 1. Setup schema
  process.stdout.write("  Setting up schema... ");
  await setupSchema(config);

  // 2. Seed data
  process.stdout.write("  Seeding data... ");
  const seed = await seedData(config);
  console.log(
    `  ✓ Seed: userId=${seed.userId}, postId=${seed.postId}, addressId=${seed.addressId}`,
  );

  // 3. Connect adapters
  console.log("\n  Connecting adapters...");
  const entries = await loadAdapters(config);
  console.log(`  ✓ ${entries.length} adapter(s) connected\n`);

  if (entries.length === 0) {
    console.error("  No adapters connected, exiting.");
    process.exit(1);
  }

  // 4. Run benchmarks
  for (const entry of entries) {
    const name = `${entry.adapter.name} (${entry.type})`;
    console.log(`  ▶  Running ${name}...`);
    try {
      if (entry.type === "model" && (suite === "model" || suite === "all")) {
        const results = await runModelSuite(
          entry.adapter,
          seed,
          warmup,
          iterations,
        );
        allResults.push(...results);
      } else if (entry.type === "raw" && (suite === "raw" || suite === "all")) {
        const results = await runRawSuite(
          entry.adapter,
          seed,
          warmup,
          iterations,
        );
        allResults.push(...results);
      }
      console.log(`  ✓  ${name} done`);
    } catch (e) {
      console.error(`  ✗  ${name} failed: ${(e as Error).message}`);
    }
  }

  // 5. Disconnect
  for (const entry of entries) {
    try {
      await entry.adapter.disconnect();
    } catch {
      // ignore disconnect errors
    }
  }

  // 6. Report
  printResults(allResults, dialect, warmup, iterations);
  saveResults(allResults, dialect);
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
