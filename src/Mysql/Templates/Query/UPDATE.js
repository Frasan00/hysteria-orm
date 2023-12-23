const updateTemplate = (table) => {
    return {
        update: (columns, values) => `UPDATE ${table} SET ${columns
            .map((column, index) => `${column} = ${values[index]}`)
            .join(", ")}`,
    };
};
export default updateTemplate;
