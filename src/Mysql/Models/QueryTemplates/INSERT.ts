const insertTemplate = (tableName: string) => {
  return {
    insert: (columns: string[], values: string[]) =>
      `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values
        .map((value) => `'${value}'`)
        .join(", ")}) `,
  };
};

export default insertTemplate;
