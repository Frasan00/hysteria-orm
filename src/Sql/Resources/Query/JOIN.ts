import { convertCase } from "../../../CaseUtils";
import { Model } from "../../Models/Model";

const joinTemplate = (
  typeofModel: typeof Model,
  relatedTable: string,
  primaryColumn: string,
  foreignColumn: string,
) => {
  const table = typeofModel.table;
  const foreignColumnName = foreignColumn.includes(".")
    ? foreignColumn.split(".").pop()
    : foreignColumn;
  const primaryColumnName = primaryColumn.includes(".")
    ? primaryColumn.split(".").pop()
    : primaryColumn;

  return {
    innerJoin: () => {
      const foreignColumnConverted = convertCase(
        foreignColumnName,
        typeofModel.databaseCaseConvention,
      );
      const primaryColumnConverted = convertCase(
        primaryColumnName,
        typeofModel.databaseCaseConvention,
      );

      return `\nINNER JOIN ${relatedTable} ON ${relatedTable}.${foreignColumnConverted} = ${table}.${primaryColumnConverted} `;
    },
    leftJoin: () => {
      const foreignColumnConverted = convertCase(
        foreignColumnName,
        typeofModel.databaseCaseConvention,
      );
      const primaryColumnConverted = convertCase(
        primaryColumnName,
        typeofModel.databaseCaseConvention,
      );

      return `\nLEFT JOIN ${relatedTable} ON ${relatedTable}.${foreignColumnConverted} = ${table}.${primaryColumnConverted} `;
    },
  };
};

export default joinTemplate;
