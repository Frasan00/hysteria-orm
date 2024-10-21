import { SelectableType } from "../models/model_manager/model_manager_types";

export type DeleteOptions = {
  ignoreBeforeDeleteHook?: boolean;
};

export type SoftDeleteOptions<T> = {
  column?: SelectableType<T>;
  value?: string | number | boolean;
  ignoreBeforeDeleteHook?: boolean;
};
