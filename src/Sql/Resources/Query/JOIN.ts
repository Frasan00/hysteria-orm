import { camelToSnakeCase } from "../../../CaseUtils";

const joinTemplate = (
  table: string,
  relatedTable: string,
  primaryColumn: string,
  foreignColumn: string,
) => {
  return {
    innerJoin: () => {
      return `\nINNER JOIN ${relatedTable} ON ${relatedTable}.${camelToSnakeCase(
        foreignColumn,
      )} = ${table}.${camelToSnakeCase(primaryColumn)}`;
    },
    leftJoin: () => {
      return `\nLEFT JOIN ${relatedTable} ON ${relatedTable}.${camelToSnakeCase(
        foreignColumn,
      )} = ${table}.${camelToSnakeCase(primaryColumn)}`;
    },
  };
};

export default joinTemplate;
