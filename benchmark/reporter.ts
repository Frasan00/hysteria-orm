import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type {
  BenchmarkResult,
  BenchmarkStats,
  Dialect,
} from "./adapters/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function fmt(ms: number): string {
  return ms.toFixed(3).padStart(8) + " ms";
}

function pad(s: string, width: number): string {
  return s.length >= width
    ? s.slice(0, width)
    : s + " ".repeat(width - s.length);
}

function separator(colWidths: number[]): string {
  return "+-" + colWidths.map((w) => "-".repeat(w)).join("-+-") + "-+";
}

function row(cells: string[], colWidths: number[]): string {
  return "| " + cells.map((c, i) => pad(c, colWidths[i])).join(" | ") + " |";
}

export function printResults(
  results: BenchmarkResult[],
  dialect: Dialect,
  warmup: number,
  iterations: number,
): void {
  console.log("\n" + "=".repeat(80));
  console.log(
    `  BENCHMARK RESULTS  |  Dialect: ${dialect.toUpperCase()}  |  Warmup: ${warmup}  |  Iterations: ${iterations}`,
  );
  console.log("=".repeat(80));

  const suites: Array<"model" | "raw"> = ["model", "raw"];

  for (const suite of suites) {
    const suiteResults = results.filter((r) => r.suite === suite);
    if (suiteResults.length === 0) continue;

    const adapters = [...new Set(suiteResults.map((r) => r.adapter))];
    const operations = [...new Set(suiteResults.map((r) => r.operation))];

    console.log(`\n  ${suite.toUpperCase()} SUITE`);

    const opCol = 28;
    const metricCol = 12;
    const adapterCols = adapters.map(() => 12);
    const allCols = [opCol, metricCol, ...adapterCols];

    const header = [
      pad("Operation", opCol),
      pad("Metric", metricCol),
      ...adapters.map((a) => pad(a, 12)),
    ];
    console.log(separator(allCols));
    console.log(row(header, allCols));
    console.log(separator(allCols));

    for (const op of operations) {
      const metrics: Array<keyof BenchmarkStats> = [
        "mean",
        "median",
        "p95",
        "p99",
        "min",
        "max",
      ];
      metrics.forEach((metric, mi) => {
        const cells = [
          mi === 0 ? pad(op, opCol) : pad("", opCol),
          pad(metric, metricCol),
          ...adapters.map((adapter) => {
            const r = suiteResults.find(
              (x) => x.operation === op && x.adapter === adapter,
            );
            if (!r) return pad("N/A", 12);
            const v = r.stats[metric] as number;
            return pad(fmt(v), 12);
          }),
        ];
        console.log(row(cells, allCols));
      });
      console.log(separator(allCols));
    }
  }
}

export function saveResults(
  results: BenchmarkResult[],
  dialect: Dialect,
): void {
  const dir = join(__dirname, "results");
  mkdirSync(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = join(dir, `benchmark-${dialect}-${timestamp}.json`);

  writeFileSync(
    filename,
    JSON.stringify(
      { dialect, timestamp: new Date().toISOString(), results },
      null,
      2,
    ),
  );
  console.log(`\n  Results saved to: ${filename}`);
}
