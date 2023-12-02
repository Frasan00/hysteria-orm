const joinTemplate = (table: string) => {
  return {
    innerJoin: (table: string) => `\nINNER JOIN ${table} `,
    leftJoin: (table: string) => `\nLEFT JOIN ${table} `,
    rightJoin: (table: string) => `\nRIGHT JOIN ${table} `,
    joinOn: (column1: string, column2: string) =>
      `\nON ${column1} = ${column2} `,
    joinOnTable: (table: string, column1: string, column2: string) =>
      `\nON ${table}.${column1} = ${table}.${column2} `,
  };
};

export default joinTemplate;
