export type PickMethods<T, K extends keyof T> = {
  [P in K]: T[P];
};
