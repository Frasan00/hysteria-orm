type WithPerformanceResult<R = any> = [string, R];

/**
 * @description executes the async function with a timer to check how long it took
 * @param `returnType` of the performance in milliseconds or seconds
 * @param `fix` Number of digits in the decimal part of the performance result
 * @returns An array with the millis or seconds that the function took as first element, and the result of the async function as second element
 */
export const withPerformance =
  <A extends any[], R>(
    fn: (...args: A) => Promise<R>,
    returnType: "millis" | "seconds" = "millis",
    fix = 3,
  ) =>
  async (...args: A): Promise<WithPerformanceResult<R>> => {
    const start = performance.now();
    const res = await fn(...args);
    const elapsed = performance.now() - start;

    const value = returnType === "millis" ? elapsed : elapsed / 1000;
    return [value.toFixed(fix), res];
  };
