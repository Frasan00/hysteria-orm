import { convertCase } from "../../../utils/case_utils";
import { Model } from "../../models/model";
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

  const foreignColumnConverted = convertCase(
    foreignColumnName,
    typeofModel.databaseCaseConvention,
  );
  const primaryColumnConverted = convertCase(
    primaryColumnName,
    typeofModel.databaseCaseConvention,
  );

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
