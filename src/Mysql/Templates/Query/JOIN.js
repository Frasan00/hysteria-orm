const joinTemplate = (table, relationTable) => {
    return {
        hasOne() {
            return `\nLEFT JOIN ${relationTable} ON ${table}.id = ${relationTable}.${table}_id`;
        },
        belongsTo(foreignKey) {
            return `\nLEFT JOIN ${relationTable} ON ${table}.id = ${relationTable}.${foreignKey}`;
        },
        hasMany(foreignKey) {
            return `\nLEFT JOIN ${relationTable} ON ${table}.id = ${relationTable}.${foreignKey}`;
        },
    };
};
export default joinTemplate;
