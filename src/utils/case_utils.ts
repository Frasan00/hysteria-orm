export type CaseConvention =
  | "camel"
  | "snake"
  | "preserve"
  | RegExp
  | ((column: string) => string);

function toSnake(str: any) {
  if (typeof str !== "string" || !str) {
    return str;
  }

  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

function toCamel(str: any) {
  if (typeof str !== "string" || !str) {
    return str;
  }

  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", ""),
  );
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

  if (to instanceof RegExp) {
    return value.replace(to, (x: string) => x[1].toUpperCase());
  }

  return to(value);
}
