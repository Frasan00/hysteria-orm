import { baseSoftDeleteDate } from "../../utils/date_utils";
import { Model } from "../models/model";
import { RawModelOptions } from "../models/model_types";

export const getRawQueryBuilderModel = (
  table: string,
  options?: RawModelOptions,
): typeof Model => {
  return {
    table,
    modelCaseConvention: "preserve",
    databaseCaseConvention: options?.databaseCaseConvention ?? "preserve",
    softDeleteColumn: options?.softDeleteColumn ?? "deleted_at",
    softDeleteValue: options?.softDeleteValue ?? baseSoftDeleteDate(),
  } as typeof Model;
};
