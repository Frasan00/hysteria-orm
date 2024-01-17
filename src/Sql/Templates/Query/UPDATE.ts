const updateTemplate = (table: string) => {
  return {
    update: (
      columns: string[],
      values: string[],
      primaryKey?: string,
      primaryKeyValue?: string | undefined,
    ) =>
      `UPDATE ${table} SET ${columns
        .map((column, index) => parseColumnValue(column, values[index]))
        .join(", ")} WHERE ${primaryKey} = ${primaryKeyValue};`,
  };
};

function parseColumnValue(column: string, value: any) {
  if (typeof value === "string") {
    return `${column} = '${value}'`;
  }

  return `${column} = ${value}`;
}

export default updateTemplate;
