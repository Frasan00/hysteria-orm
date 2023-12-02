const setTemplate = (table: string) => {
  return {
    set: (column: string, value: string) => `\nSET ${column} = ${value} `,
    setMulti: (columns: string[], values: string[]) =>
      `\nSET ${columns.join(", ")} = ${values.join(", ")} `,
  };
};

export default setTemplate;
