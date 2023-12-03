const whereTemplate = () => {
  return {
    where: (column: string, value: string) => `\nWHERE ${column} = ${value} `,
    andWhere: (column: string, value: string) => ` AND ${column} = ${value} `,
    orWhere: (column: string, value: string) => ` OR ${column} = ${value} `,
    whereNot: (column: string, value: string) =>
      `\nWHERE ${column} != ${value} `,
    andWhereNot: (column: string, value: string) =>
      ` AND ${column} != ${value} `,
    orWhereNot: (column: string, value: string) => ` OR ${column} != ${value} `,
    whereNull: (column: string) => `\nWHERE ${column} IS NULL `,
    whereNotNull: (column: string) => `\nWHERE ${column} IS NOT NULL `,
    whereLike: (column: string, value: string) =>
      `\nWHERE ${column} LIKE ${value} `,
    whereBetween: (column: string, min: string, max: string) =>
      `\nWHERE ${column} BETWEEN ${min} AND ${max} `,
    whereNotBetween: (column: string, min: string, max: string) =>
      `\nWHERE ${column} NOT BETWEEN ${min} AND ${max} `,
  };
};

export default whereTemplate;
