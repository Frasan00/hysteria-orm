const deleteTemplate = (tableName) => {
    return {
        delete: (column, value) => `\nDELETE FROM ${tableName} WHERE ${column} = ${value} `,
    };
};
export default deleteTemplate;
