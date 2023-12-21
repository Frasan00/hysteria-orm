const joinTemplate = (table: string, relationTable: string) => {
  return {
    hasOne(): string {
      return `\nLEFT JOIN ${relationTable} ON ${table}.id = ${relationTable}.${table}_id`;
    },
    belongsTo(foreignKey: string): string {
      return `\nLEFT JOIN ${relationTable} ON ${table}.id = ${relationTable}.${foreignKey}`;
    },
    hasMany(foreignKey: string): string {
      return `\nLEFT JOIN ${relationTable} ON ${table}.id = ${relationTable}.${foreignKey}`;
    },
  };
};

export default joinTemplate;
