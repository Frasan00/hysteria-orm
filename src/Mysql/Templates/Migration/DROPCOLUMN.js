export const dropColumn = (tableName, dropColumn) => {
    const columnString = dropColumn.map((dropColumn) => {
        if (dropColumn.foreignKey) {
            return `DROP FOREIGN KEY ${dropColumn.name}`;
        }
        return `DROP COLUMN ${dropColumn.name}`;
    });
    return `ALTER TABLE ${tableName} ${columnString.join(", ")};`;
};
