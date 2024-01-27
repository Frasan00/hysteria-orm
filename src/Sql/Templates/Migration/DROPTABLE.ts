const dropTableTemplate = (tableName: string, ifExists: boolean) =>
  ifExists ? `DROP TABLE IF EXISTS ${tableName}` : `DROP TABLE ${tableName}`;

export default dropTableTemplate;
