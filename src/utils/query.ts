/**
 * @description bind params into query, useful for logging and toQuery()
 */
export const bindParamsIntoQuery = (query: string, params: any[]): string => {
  let result = query;
  let paramIndex = 0;

  // Replace MySQL-style placeholders
  while (result.includes("?")) {
    const param = params[paramIndex];
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

    result = result.replace("?", formattedParam);
    paramIndex++;
  }

  // Replace PostgreSQL-style placeholders
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    let formattedParam: any = null;

    if (typeof param === "string") {
      formattedParam = `'${param}'`;
    } else if (
      typeof param === "object" &&
      param !== null &&
      Object.keys(param).length > 0
    ) {
      formattedParam = `'${JSON.stringify(param)}'`;
    } else if (param instanceof Date) {
      formattedParam = `'${param.toISOString()}'`;
    } else {
      formattedParam = param;
    }

    const pgPlaceholder = new RegExp(`\\$${i + 1}(?!\\d)`, "g");
    result = result.replace(pgPlaceholder, formattedParam);
  }

  return result;
};
