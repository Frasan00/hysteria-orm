import type { BenchmarkStats } from "./adapters/types.js";

function computeStats(timesMs: number[]): BenchmarkStats {
  const sorted = [...timesMs].sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((s, t) => s + t, 0);
  const mean = total / n;
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
  const p95 = sorted[Math.floor(n * 0.95)];
  const p99 = sorted[Math.floor(n * 0.99)];

  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median,
    p95,
    p99,
    total,
    iterations: n,
  };
}

/**
 * Measures the execution time of `fn` over `iterations` runs, after
 * `warmup` un-timed warm-up iterations. An optional `perIterationSetup`
 * runs before each iteration (warmup and timed) but is excluded from timing.
 */
export async function measure(
  fn: () => Promise<unknown>,
  warmup: number,
  iterations: number,
  perIterationSetup?: () => Promise<unknown>,
): Promise<BenchmarkStats> {
  // Warm-up phase — primes connection pools, caches, JIT
  for (let i = 0; i < warmup; i++) {
    await perIterationSetup?.();
    await fn();
  }

  // Timed phase
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    await perIterationSetup?.(); // excluded from timing
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1_000_000); // ns → ms
  }

  return computeStats(times);
}
