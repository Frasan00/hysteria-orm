const whereTemplate = (tableName: string) => {
  return {
    where: (column: string, value: string) =>
      `\nWHERE ${tableName}.${column} = ${value} `,
    andWhere: (column: string, value: string) =>
      ` AND ${tableName}.${column} = ${value} `,
    orWhere: (column: string, value: string) =>
      ` OR ${tableName}.${column} = ${value} `,
    whereNot: (column: string, value: string) =>
      `\nWHERE ${tableName}.${column} != ${value} `,
    andWhereNot: (column: string, value: string) =>
      ` AND ${tableName}.${column} != ${value} `,
    orWhereNot: (column: string, value: string) =>
      ` OR ${tableName}.${column} != ${value} `,
    whereNull: (column: string) => `\nWHERE ${tableName}.${column} IS NULL `,
    whereNotNull: (column: string) =>
      `\nWHERE ${tableName}.${column} IS NOT NULL `,
    whereLike: (column: string, value: string) =>
      `\nWHERE ${tableName}.${column} LIKE ${value} `,
    whereBetween: (column: string, min: string, max: string) =>
      `\nWHERE ${tableName}.${column} BETWEEN ${min} AND ${max} `,
    whereNotBetween: (column: string, min: string, max: string) =>
      `\nWHERE ${tableName}.${column} NOT BETWEEN ${min} AND ${max} `,
  };
};

export default whereTemplate;
