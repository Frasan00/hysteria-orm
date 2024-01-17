const deleteTemplate = (tableName: string) => {
  return {
    delete: (column: string, value: string) =>
      `\nDELETE FROM ${tableName} WHERE ${column} = ${value} `,
  };
};

export default deleteTemplate;
