export type PickMethods<T, K extends keyof T> = {
  [P in K]: T[P];
};

export const coerceToNumber = (value: string | number): number => {
  if (typeof value === "number") {
    return value;
  }

  return parseFloat(value);
};
