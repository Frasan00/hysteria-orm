const insertTemplate = (tableName) => {
    return {
        insert: (columns, values) => `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values
            .map((value) => `'${value}'`)
            .join(", ")}) `,
    };
};
export default insertTemplate;
