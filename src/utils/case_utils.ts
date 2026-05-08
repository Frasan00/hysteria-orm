export type CaseConvention =
  | "camel"
  | "snake"
  | "pascal"
  | "preserve"
  | RegExp
  | ((column: string) => string);

export function toSnake(str: any) {
  if (typeof str !== "string" || !str) {
    return str;
  }

  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

export function toCamel(str: any) {
  if (typeof str !== "string" || !str) {
    return str;
  }

  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", ""),
  );
}

/**
 * Convert a string to PascalCase
 * Examples:
 * - user_account → UserAccount
 * - userAccount → UserAccount
 * - user → User
 */
export function toPascal(str: string): string {
  if (typeof str !== "string" || !str) {
    return str;
  }

  // First convert to camelCase, then capitalize first letter
  const camel = toCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function convertCase(value: any, to: CaseConvention) {
  if (to === "preserve") {
    return value;
  }

  if (to === "snake") {
    return toSnake(value);
  }

  if (to === "camel") {
    return toCamel(value);
  }

  if (to === "pascal") {
    return toPascal(value);
  }

  if (to instanceof RegExp) {
    return value.replace(to, (x: string) => x[1].toUpperCase());
  }

  return to(value);
}
