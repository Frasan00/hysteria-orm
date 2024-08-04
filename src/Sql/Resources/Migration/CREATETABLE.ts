const createTableTemplate = {
  createTableIfNotExists: (tableName: string) =>
    `\nCREATE TABLE IF NOT EXISTS ${tableName} (\n`,
  createTable: (tableName: string) => `\nCREATE TABLE \`${tableName}\` (\n`,
  createTableEnd: "\n);",
};

export default createTableTemplate;
