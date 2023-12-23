const insertTemplate = (tableName: string) => {
  return {
    insert: (columns: string[], values: string[]) => {
      values = parseValues(values);
      return `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES (${values.join(", ")});`;
    },
  };
};

function parseValues(values: string[]) {
  return values.map((value: any) => {
    if (typeof value === "string") {
      return `'${value}'`;
    }

    return value || "DEFAULT";
  });
}

export default insertTemplate;
