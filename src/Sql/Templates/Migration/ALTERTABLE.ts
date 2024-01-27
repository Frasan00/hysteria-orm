const alterTableTemplate = () => ({
  alterTable: (tableName: string) => `\nALTER TABLE \`${tableName}\``,
  addColumn: (columnName: string, columnType: string) =>
    `\nADD COLUMN \`${columnName}\` ${columnType}`,
  dropColumn: (columnName: string) => `\nDROP COLUMN \`${columnName}\``,
});
