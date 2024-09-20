export type CaseConvention =
  | "camel"
  | "snake"
  | "none"
  | RegExp
  | ((column: string) => string);

function camelToSnakeCase(camelCase: any) {
  if (typeof camelCase !== "string" || !camelCase) {
    return camelCase;
  }

  return camelCase.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function fromSnakeToCamelCase(snake: any) {
  if (typeof snake !== "string" || !snake) {
    return snake;
  }

  return snake.replace(/(_\w)/g, (x) => x[1].toUpperCase());
}

export function convertCase(value: any, to: CaseConvention) {
  if (to === "none") {
    return value;
  }

  if (to === "snake") {
    return camelToSnakeCase(value);
  }

  if (to === "camel") {
    return fromSnakeToCamelCase(value);
  }

  if (to instanceof RegExp) {
    return value.replace(to, (x: string) => x[1].toUpperCase());
  }

  return to(value);
}
