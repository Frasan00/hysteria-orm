export type JsEnvironmentValue = "auto" | "node" | "bun" | "web" | "react-native";

export type ResolvedJsEnvironment = "node" | "bun" | "web" | "react-native";

export function resolveJsEnvironment(
  value?: JsEnvironmentValue,
): ResolvedJsEnvironment {
  if (value && value !== "auto") {
    return value;
  }

  if (typeof process !== "undefined" && process.versions?.bun) {
    return "bun";
  }

  // React Native has neither window nor document and reports itself here.
  const navigatorProduct = (globalThis as { navigator?: { product?: string } })
    .navigator?.product;
  if (navigatorProduct === "ReactNative" || "HermesInternal" in globalThis) {
    return "react-native";
  }

  // `self` is the only reliable signal for workers: they have no window or
  // document, and without this they resolve to "node" and then dereference
  // process.env at import time (env.ts loads the platform at module-eval).
  const hasSelf =
    typeof (globalThis as { self?: unknown }).self !== "undefined";

  if (
    typeof window !== "undefined" ||
    typeof document !== "undefined" ||
    hasSelf
  ) {
    return "web";
  }

  return "node";
}
