const joinTemplate = (_table: string, relatedTable: string, primaryColumn: string, foreignColumn: string) => {
  return {
    innerJoin: () => {
      return `\nINNER JOIN ${relatedTable} ON ${primaryColumn} = ${foreignColumn}`;
    },
    leftJoin: () => {
      return `\nLEFT JOIN ${relatedTable} ON ${primaryColumn} = ${foreignColumn}`;
    }
  }
};

export default joinTemplate;
