const whereTemplate = () => {
  return {
    where: (column: string) => `\nWHERE ${column} = ? `,
    andWhere: (column: string) => ` AND ${column} = ? `,
    orWhere: (column: string) => ` OR ${column} = ? `,
    whereNot: (column: string) => `\nWHERE ${column} != ? `,
    andWhereNot: (column: string) => ` AND ${column} != ? `,
    orWhereNot: (column: string) => ` OR ${column} != ? `,
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
