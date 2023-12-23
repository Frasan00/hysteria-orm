export const dropTruncateTable = (table) => {
    if (table.dropTable) {
        return `DROP TABLE ${table.tableName};`;
    }
    if (table.truncateTable) {
        return `TRUNCATE TABLE ${table.tableName};`;
    }
    return "";
};
