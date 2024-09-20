import { convertCase } from "../../../CaseUtils";
import { Model } from "../../Models/Model";

const joinTemplate = (
  typeofModel: typeof Model,
  relatedTable: string,
  primaryColumn: string,
  foreignColumn: string,
) => {
  const table = typeofModel.table;
  return {
    innerJoin: () => {
      return `\nINNER JOIN ${relatedTable} ON ${relatedTable}.${convertCase(
        foreignColumn,
        typeofModel.databaseCaseConvention,
      )} = ${table}.${convertCase(
        primaryColumn,
        typeofModel.databaseCaseConvention,
      )}`;
    },
    leftJoin: () => {
      return `\nLEFT JOIN ${relatedTable} ON ${relatedTable}.${convertCase(
        foreignColumn,
        typeofModel.databaseCaseConvention,
      )} = ${table}.${convertCase(
        primaryColumn,
        typeofModel.databaseCaseConvention,
      )}`;
    },
  };
};

export default joinTemplate;
