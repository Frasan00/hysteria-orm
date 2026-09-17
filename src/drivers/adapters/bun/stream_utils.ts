import { PassThrough } from "node:stream";
import type { StreamOptions } from "../../../sql/query_builder/query_builder_types";
import type { StreamEvents } from "../../driver_adapter";

/**
 * Buffered stream fallback. bun-sql (1.4) has no cursor API and bun:sqlite
 * `.iterate()` is not always available, so the full result set is pushed
 * through a PassThrough after the query completes; onData is awaited per row
 * so consumer backpressure is honored. Consuming code sees identical
 * row/end/error events; only the memory profile for huge result sets differs.
 */
export const bufferIntoPassThrough = async (
  rows: unknown[],
  options: StreamOptions = {},
  events: StreamEvents,
): Promise<PassThrough & AsyncGenerator<Record<string, unknown>>> => {
  const passThrough = new PassThrough({
    objectMode: options.objectMode ?? true,
    highWaterMark: options.highWaterMark,
  }) as PassThrough & AsyncGenerator<Record<string, unknown>>;

  try {
    for (const row of rows) {
      if (events.onData) {
        await events.onData(passThrough, row);
      } else {
        passThrough.write(row);
      }
    }
    passThrough.end();
  } catch (err) {
    passThrough.destroy(err as Error);
  }

  return passThrough;
};
