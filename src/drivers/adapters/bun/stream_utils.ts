import { PassThrough } from "node:stream";
import type { StreamOptions } from "../../../sql/query_builder/query_builder_types";
import type { StreamEvents } from "../../driver_adapter";

/**
 * Buffered stream fallback for drivers with no cursor API (bun-sql in 1.4).
 * The full result set is pushed through a PassThrough after the query completes;
 * onData is awaited per row so consumer backpressure is honored. Consuming code
 * sees identical row/end/error events; only the memory profile for huge result
 * sets differs from the cursor-based stream.
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

/** Wait for a slow consumer before writing the next row */
const waitForSpace = (passThrough: PassThrough): Promise<void> | undefined => {
  if (!passThrough.writableNeedDrain) {
    return undefined;
  }
  return new Promise<void>((resolve) =>
    passThrough.once("drain", () => resolve()),
  );
};

/**
 * Cursor-based stream: pulls rows lazily from the iterator and pushes them into
 * a PassThrough, awaiting 'drain' when the buffer fills. Huge result sets never
 * materialize in memory — only the rows a slow consumer hasn't consumed yet.
 */
export const streamIntoPassThrough = async (
  iterable: Iterable<unknown>,
  options: StreamOptions = {},
  events: StreamEvents,
): Promise<PassThrough & AsyncGenerator<Record<string, unknown>>> => {
  const passThrough = new PassThrough({
    objectMode: options.objectMode ?? true,
    highWaterMark: options.highWaterMark,
  }) as PassThrough & AsyncGenerator<Record<string, unknown>>;

  try {
    for (const row of iterable) {
      if (events.onData) {
        await events.onData(passThrough, row);
      } else {
        passThrough.write(row);
      }
      await waitForSpace(passThrough);
    }
    passThrough.end();
  } catch (err) {
    passThrough.destroy(err as Error);
  }

  return passThrough;
};
