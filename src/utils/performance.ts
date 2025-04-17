import * as perf from "node:perf_hooks";

type WithPerformanceResult<R = any> = [string, R];

/**
 * @description executes the async function with a timer to check how long it took
 * @param `returnType` of the performance in milliseconds or seconds
 * @param `fix` Number of digits in the decimal part of the performance result
 * @returns An array with the millis or seconds that the function took as first element, and the result of the async function as second element
 */
export const withPerformance = async <R = any>(
  fn: (...params: any) => Promise<R>,
  returnType: "millis" | "seconds" = "millis",
  fix: number = 3,
): Promise<WithPerformanceResult<R>> => {
  const start = perf.performance.now();
  const res = await fn();
  const end = perf.performance.now() - start;

  if (returnType === "millis") {
    return [end.toFixed(fix), res] as WithPerformanceResult<R>;
  }

  return [(end / 1000).toFixed(fix), res];
};
