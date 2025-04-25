import { convertCase } from "../../../utils/case_utils";
import { Model } from "../../models/model";
import { getModelColumns } from "../../models/model_decorators";
import { BinaryOperatorType } from "./WHERE";

const joinTemplate = (
  typeofModel: typeof Model,
  relatedTable: string,
  primaryColumn: string,
  foreignColumn: string,
  operator: BinaryOperatorType = "=",
) => {
  const table = typeofModel.table;
  const foreignColumnName = foreignColumn.includes(".")
    ? foreignColumn.split(".").pop()
    : foreignColumn;
  const primaryColumnName = primaryColumn.includes(".")
    ? primaryColumn.split(".").pop()
    : primaryColumn;

  const modelColumns = getModelColumns(typeofModel);
  const modelColumnsMap = new Map(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  const foreignColumnConverted =
    modelColumnsMap.get(foreignColumnName || "")?.databaseName ??
    convertCase(foreignColumnName, typeofModel.databaseCaseConvention);
  const primaryColumnConverted =
    modelColumnsMap.get(primaryColumnName || "")?.databaseName ??
    convertCase(primaryColumnName, typeofModel.databaseCaseConvention);

  return {
    innerJoin: () =>
      `\nINNER JOIN ${relatedTable} ON ${relatedTable}.${foreignColumnConverted} ${operator} ${table}.${primaryColumnConverted} `,
    leftJoin: () =>
      `\nLEFT JOIN ${relatedTable} ON ${relatedTable}.${foreignColumnConverted} ${operator} ${table}.${primaryColumnConverted} `,
    rightJoin: () =>
      `\nRIGHT JOIN ${relatedTable} ON ${relatedTable}.${foreignColumnConverted} ${operator} ${table}.${primaryColumnConverted} `,
  };
};

export default joinTemplate;
