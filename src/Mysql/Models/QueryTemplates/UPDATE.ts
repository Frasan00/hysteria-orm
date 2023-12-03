const updateTemplate = (table: string) => {
  return {
    update: (columns: string[], values: string[]) =>
      `UPDATE ${table} SET ${columns
        .map((column, index) => `${column} = ${values[index]}`)
        .join(", ")} `,
  };
};

export default updateTemplate;
