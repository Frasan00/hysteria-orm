/**
 * jsdom exposes neither TextDecoder nor TextEncoder, which sqlite-wasm needs.
 * Real browsers have both — this is a test-environment shim only, so the driver
 * code stays free of node imports.
 */
import { TextDecoder, TextEncoder } from "node:util";

if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder;
}
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}
