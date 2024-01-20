const deleteTemplate = (tableName: string) => {
  return {
    delete: (column: string, value: string | number | boolean | Date) =>
      `\nDELETE FROM ${tableName} WHERE ${column} = ${parseValue(value)} `,
  };
};

function parseValue(value: any) {
  if (typeof value === "string") {
    return `'${value}'`;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  return value;
}

export default deleteTemplate;
