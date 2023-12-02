import { FindType } from "./ModelManagerTypes";
import selectTemplate from "../QueryTemplates/SELECT";
import whereTemplate from "../QueryTemplates/WHERE.TS";

class ModelManagerUtils {
  public parseSelectQueryInput(tableName: string, input: FindType): string {
    let query = "";
    this.parseSelect(query, tableName, input);
    this.parseWhere(query, input);
    // to do parse join after relations
    this.parseQueryFooter(query, tableName, input);

    return query;
  }

  private parseSelect(query: string, tableName: string, input: FindType): void {
    const select = selectTemplate(tableName);
    query += input.select
      ? (query += select.selectColumns(...input.select))
      : (query += select.selectAll);
  }

  private parseWhere(query: string, input: FindType): void {
    const where = whereTemplate();
    if (!input.where) {
      return;
    }

    for (let i = 0; i < input.where.length; i++) {
      if (i === 0) {
        query += where.where(input.where[i]);
        continue;
      }

      query += where.andWhere(input.where[i]);
    }
  }

  private parseQueryFooter(
    query: string,
    tableName: string,
    input: FindType,
  ): void {
    const select = selectTemplate(tableName);
    if (input.offset) {
      query += select.offset(input.offset);
    }

    if (input.groupBy) {
      query += select.groupBy(...input.groupBy);
    }

    if (input.orderBy) {
      query += select.orderBy(input.orderBy);
    }

    if (input.limit) {
      query += select.limit(input.limit);
    }
  }

  // TO DO parse INSERT UPDATE DELETE
}

export default new ModelManagerUtils();
