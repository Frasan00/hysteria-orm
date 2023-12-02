const deleteTemplate = (tableName: string) => {
  return {
    delete: (column: string) =>
      `\nDELETE FROM ${tableName} WHERE ${column} = ? `,
  };
};

export default deleteTemplate;
