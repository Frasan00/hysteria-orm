export function camelToSnakeCase(camelCase: any) {
  if (typeof camelCase !== "string" || !camelCase) {
    return camelCase;
  }

  return camelCase.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

export function fromSnakeToCamelCase(snake: any) {
  if (typeof snake !== "string" || !snake) {
    return snake;
  }

  return snake.replace(/(_\w)/g, (x) => x[1].toUpperCase());
}
