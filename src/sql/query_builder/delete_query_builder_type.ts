import type { ModelKey } from "../models/model_manager/model_manager_types";

export type DeleteOptions = {
  ignoreBeforeDeleteHook?: boolean;
};

export type SoftDeleteOptions<T> = {
  column?: ModelKey<T>;
  value?: string | number | boolean;
  ignoreBeforeDeleteHook?: boolean;
};
