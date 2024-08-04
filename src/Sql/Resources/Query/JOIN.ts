import * as sqlString from "sqlstring";

const joinTemplate = (
  _table: string,
  relatedTable: string,
  primaryColumn: string,
  foreignColumn: string,
) => {
  return {
    innerJoin: () => {
      return `\nINNER JOIN ${sqlString.escape(
        relatedTable,
      )} ON ${sqlString.escape(primaryColumn)} = ${sqlString.escape(
        foreignColumn,
      )}`;
    },
    leftJoin: () => {
      return `\nLEFT JOIN ${sqlString.escape(
        relatedTable,
      )} ON ${sqlString.escape(primaryColumn)} = ${sqlString.escape(
        foreignColumn,
      )}`;
    },
  };
};

export default joinTemplate;
