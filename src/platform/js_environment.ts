export type JsEnvironmentValue = "auto" | "node" | "bun" | "web";

export type ResolvedJsEnvironment = "node" | "bun" | "web";

export function resolveJsEnvironment(
  value?: JsEnvironmentValue,
): ResolvedJsEnvironment {
  if (value && value !== "auto") {
    return value;
  }

  if (typeof process !== "undefined" && process.versions?.bun) {
    return "bun";
  }

  if (typeof window !== "undefined" || typeof document !== "undefined") {
    return "web";
  }

  return "node";
}
