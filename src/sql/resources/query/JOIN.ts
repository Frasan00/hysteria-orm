import { convertCase } from "../../../utils/case_utils";
import { getModelColumns } from "../../models/decorators/model_decorators";
import { Model } from "../../models/model";
import { BinaryOperatorType } from "./WHERE";

const joinTemplate = (
  typeofModel: typeof Model,
  relatedTable: string,
  primaryColumn: string,
  foreignColumn: string,
  operator: BinaryOperatorType = "=",
) => {
  const [foreignTableName, foreignColumnName] = foreignColumn.includes(".")
    ? foreignColumn.split(".")
    : [relatedTable, foreignColumn];
  const [primaryTableName, primaryColumnName] = primaryColumn.includes(".")
    ? primaryColumn.split(".")
    : [typeofModel.table, primaryColumn];

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
      `\nINNER JOIN ${relatedTable} ON ${foreignTableName}.${foreignColumnConverted} ${operator} ${primaryTableName}.${primaryColumnConverted} `,
    leftJoin: () =>
      `\nLEFT JOIN ${relatedTable} ON ${foreignTableName}.${foreignColumnConverted} ${operator} ${primaryTableName}.${primaryColumnConverted} `,
    rightJoin: () =>
      `\nRIGHT JOIN ${relatedTable} ON ${foreignTableName}.${foreignColumnConverted} ${operator} ${primaryTableName}.${primaryColumnConverted} `,
    fullJoin: () =>
      `\nFULL OUTER JOIN ${relatedTable} ON ${foreignTableName}.${foreignColumnConverted} ${operator} ${primaryTableName}.${primaryColumnConverted} `,
    crossJoin: () => `\nCROSS JOIN ${relatedTable} `,
    naturalJoin: () => `\nNATURAL JOIN ${relatedTable} `,
  };
};

export default joinTemplate;
