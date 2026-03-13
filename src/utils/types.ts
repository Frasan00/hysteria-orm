export type PickMethods<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Simplifies complex return types like SelectedModel to make it more readable and strips out whatever is passed as the second type parameter (e.g. SELECT_BRAND) to avoid showing it in the IDE autocomplete.
 */
export type Simplify<T, Strip> = T extends infer U
  ? { [K in keyof U as K extends Strip ? never : K]: U[K] }
  : never;

export const coerceToNumber = (value: string | number): number => {
  if (typeof value === "number") {
    return value;
  }

  return parseFloat(value);
};
