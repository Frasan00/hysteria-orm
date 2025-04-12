/**
 * @description bind params into query, useful for logging and toQuery()
 */
export const bindParamsIntoQuery = (query: string, params: any[]): string => {
  params.forEach((param, index) => {
    let formattedParam: any = null;

    if (typeof param === "string") {
      formattedParam = `'${param}'`;
    } else if (
      typeof param === "object" &&
      param !== null &&
      Object.keys(param).length > 0
    ) {
      formattedParam = `'${JSON.stringify(param)}'`;
    } else {
      formattedParam = param;
    }

    // Replace MySQL-style placeholders
    query = query.replace(/\?/, formattedParam);

    // Replace PostgreSQL-style placeholders
    const pgPlaceholder = new RegExp(`\\$${index + 1}`, "g");
    query = query.replace(pgPlaceholder, formattedParam);
  });

  return query;
};
